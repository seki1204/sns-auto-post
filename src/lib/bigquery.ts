import { BigQuery } from "@google-cloud/bigquery";
import type {
  TrafficSummary,
  TopPage,
  TopEvent,
  TrafficSource,
  BigQueryData,
} from "./types";

function getClient(): BigQuery {
  const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId = process.env.BIGQUERY_PROJECT_ID;

  if (!projectId) {
    throw new Error("BIGQUERY_PROJECT_ID が設定されていません");
  }

  return new BigQuery({
    projectId,
    ...(keyFilePath ? { keyFilename: keyFilePath } : {}),
  });
}

// GA4 BigQuery Export: databeatwaca210204.analytics_334575663.events_*
const ga4Table = () => {
  const project = process.env.BIGQUERY_PROJECT_ID || "databeatwaca210204";
  const dataset = process.env.BIGQUERY_DATASET || "analytics_334575663";
  return `\`${project}.${dataset}.events_*\``;
};

export async function fetchTrafficSummary(): Promise<TrafficSummary[]> {
  const client = getClient();

  const query = `
    SELECT
      event_date AS date,
      COUNT(DISTINCT user_pseudo_id) AS totalUsers,
      COUNT(DISTINCT CASE
        WHEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_number') = 1
        THEN user_pseudo_id
      END) AS newUsers,
      COUNT(DISTINCT CONCAT(user_pseudo_id, '-',
        CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)
      )) AS sessions,
      COUNTIF(event_name = 'page_view') AS pageviews,
      AVG(CASE
        WHEN event_name = 'user_engagement'
        THEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'engagement_time_msec') / 1000.0
      END) AS avgEngagementTime,
      SAFE_DIVIDE(
        COUNT(DISTINCT CASE
          WHEN event_name = 'user_engagement' THEN
            CONCAT(user_pseudo_id, '-',
              CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING))
        END),
        COUNT(DISTINCT CONCAT(user_pseudo_id, '-',
          CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)))
      ) AS engagementRate
    FROM ${ga4Table()}
    WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
      AND _TABLE_SUFFIX <= FORMAT_DATE('%Y%m%d', CURRENT_DATE())
    GROUP BY event_date
    ORDER BY event_date DESC
  `;

  const [rows] = await client.query({ query });
  return rows as TrafficSummary[];
}

export async function fetchTopPages(): Promise<TopPage[]> {
  const client = getClient();

  const query = `
    SELECT
      (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page,
      COUNT(*) AS pageviews,
      COUNT(DISTINCT user_pseudo_id) AS users
    FROM ${ga4Table()}
    WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
      AND _TABLE_SUFFIX <= FORMAT_DATE('%Y%m%d', CURRENT_DATE())
      AND event_name = 'page_view'
    GROUP BY page
    ORDER BY pageviews DESC
    LIMIT 10
  `;

  const [rows] = await client.query({ query });
  return rows as TopPage[];
}

export async function fetchTopEvents(): Promise<TopEvent[]> {
  const client = getClient();

  const query = `
    SELECT
      event_name AS eventName,
      COUNT(*) AS count,
      COUNT(DISTINCT user_pseudo_id) AS users
    FROM ${ga4Table()}
    WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
      AND _TABLE_SUFFIX <= FORMAT_DATE('%Y%m%d', CURRENT_DATE())
      AND event_name NOT IN ('session_start', 'first_visit', 'user_engagement')
    GROUP BY event_name
    ORDER BY count DESC
    LIMIT 10
  `;

  const [rows] = await client.query({ query });
  return rows as TopEvent[];
}

export async function fetchTrafficSources(): Promise<TrafficSource[]> {
  const client = getClient();

  const query = `
    SELECT
      traffic_source.source AS source,
      traffic_source.medium AS medium,
      COUNT(DISTINCT user_pseudo_id) AS users,
      COUNT(DISTINCT CONCAT(user_pseudo_id, '-',
        CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)
      )) AS sessions
    FROM ${ga4Table()}
    WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
      AND _TABLE_SUFFIX <= FORMAT_DATE('%Y%m%d', CURRENT_DATE())
    GROUP BY source, medium
    ORDER BY users DESC
    LIMIT 10
  `;

  const [rows] = await client.query({ query });
  return rows as TrafficSource[];
}

export async function fetchAllData(): Promise<BigQueryData> {
  const [traffic, topPages, topEvents, trafficSources] = await Promise.all([
    fetchTrafficSummary(),
    fetchTopPages(),
    fetchTopEvents(),
    fetchTrafficSources(),
  ]);

  return {
    traffic,
    topPages,
    topEvents,
    trafficSources,
    fetchedAt: new Date().toISOString(),
  };
}

// デモ用モックデータ（BigQuery未接続時）
export function getMockData(): BigQueryData {
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0].replace(/-/g, "");
  });

  return {
    traffic: dates.map((date) => ({
      date,
      totalUsers: Math.floor(Math.random() * 500) + 100,
      newUsers: Math.floor(Math.random() * 200) + 50,
      sessions: Math.floor(Math.random() * 800) + 200,
      pageviews: Math.floor(Math.random() * 2000) + 500,
      avgEngagementTime: Math.random() * 120 + 30,
      engagementRate: Math.random() * 0.4 + 0.4,
    })),
    topPages: [
      { page: "https://waca.associates/jp/", pageviews: 1200, users: 450 },
      { page: "https://waca.associates/jp/service/", pageviews: 800, users: 320 },
      { page: "https://waca.associates/jp/blog/", pageviews: 650, users: 280 },
      { page: "https://waca.associates/jp/about/", pageviews: 400, users: 200 },
      { page: "https://waca.associates/jp/contact/", pageviews: 250, users: 150 },
    ],
    topEvents: [
      { eventName: "page_view", count: 5200, users: 800 },
      { eventName: "scroll", count: 3100, users: 600 },
      { eventName: "click", count: 1800, users: 450 },
      { eventName: "file_download", count: 120, users: 80 },
      { eventName: "form_submit", count: 45, users: 40 },
    ],
    trafficSources: [
      { source: "google", medium: "organic", users: 350, sessions: 500 },
      { source: "(direct)", medium: "(none)", users: 200, sessions: 280 },
      { source: "twitter", medium: "social", users: 80, sessions: 100 },
      { source: "facebook", medium: "social", users: 50, sessions: 65 },
      { source: "newsletter", medium: "email", users: 30, sessions: 40 },
    ],
    fetchedAt: new Date().toISOString(),
  };
}
