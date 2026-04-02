"use client";

import type { BigQueryData } from "@/lib/types";

interface Props {
  data: BigQueryData;
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DataSummary({ data }: Props) {
  const t = data.traffic[0];

  return (
    <div className="space-y-6">
      {/* トラフィック概要 */}
      {t && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            トラフィック概要 ({t.date})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="総ユーザー" value={t.totalUsers.toLocaleString()} />
            <KpiCard label="新規ユーザー" value={t.newUsers.toLocaleString()} />
            <KpiCard label="セッション" value={t.sessions.toLocaleString()} />
            <KpiCard label="ページビュー" value={t.pageviews.toLocaleString()} />
            <KpiCard
              label="エンゲージメント率"
              value={`${(t.engagementRate * 100).toFixed(1)}%`}
            />
            <KpiCard
              label="平均エンゲージ時間"
              value={`${Math.round(t.avgEngagementTime)}秒`}
            />
          </div>
        </div>
      )}

      {/* 人気ページ & 流入元 */}
      <div className="grid sm:grid-cols-2 gap-4">
        {data.topPages.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h4 className="text-xs font-semibold text-gray-500 mb-3">人気ページ</h4>
            <ul className="space-y-2">
              {data.topPages.slice(0, 5).map((p, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate mr-2" title={p.page}>
                    {p.page.replace(/https?:\/\/[^/]+/, "")}
                  </span>
                  <span className="text-gray-500 whitespace-nowrap text-xs">
                    {p.pageviews.toLocaleString()} PV
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.trafficSources.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h4 className="text-xs font-semibold text-gray-500 mb-3">流入元</h4>
            <ul className="space-y-2">
              {data.trafficSources.slice(0, 5).map((s, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {s.source} / {s.medium}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {s.users.toLocaleString()} users
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 主要イベント */}
      {data.topEvents.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h4 className="text-xs font-semibold text-gray-500 mb-3">主要イベント</h4>
          <div className="flex flex-wrap gap-2">
            {data.topEvents.slice(0, 8).map((e, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700"
              >
                {e.eventName}{" "}
                <span className="text-gray-400">{e.count.toLocaleString()}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">
        取得日時: {new Date(data.fetchedAt).toLocaleString("ja-JP")}
      </p>
    </div>
  );
}
