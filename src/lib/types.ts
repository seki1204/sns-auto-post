export interface TrafficSummary {
  date: string;
  totalUsers: number;
  newUsers: number;
  sessions: number;
  pageviews: number;
  avgEngagementTime: number;
  engagementRate: number;
}

export interface TopPage {
  page: string;
  pageviews: number;
  users: number;
}

export interface TopEvent {
  eventName: string;
  count: number;
  users: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  users: number;
  sessions: number;
}

export interface BigQueryData {
  traffic: TrafficSummary[];
  topPages: TopPage[];
  topEvents: TopEvent[];
  trafficSources: TrafficSource[];
  fetchedAt: string;
}

export type PostTone = "casual" | "formal" | "data-driven";

export interface GeneratedPost {
  id: string;
  text: string;
  tone: PostTone;
  createdAt: string;
}

export interface GeneratePostsRequest {
  data: BigQueryData;
  tone: PostTone;
  count: number;
}
