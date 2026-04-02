"use client";

import { useState } from "react";
import DataSummary from "@/components/DataSummary";
import PostCard from "@/components/PostCard";
import GenerateButton from "@/components/GenerateButton";
import type { BigQueryData, PostTone, GeneratedPost } from "@/lib/types";

export default function Home() {
  const [data, setData] = useState<BigQueryData | null>(null);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [tone, setTone] = useState<PostTone>("casual");
  const [fetchingData, setFetchingData] = useState(false);
  const [generatingPosts, setGeneratingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchData = async () => {
    setFetchingData(true);
    setError(null);
    try {
      const res = await fetch("/api/fetch-data", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "データ取得に失敗しました");
      }
      const result: BigQueryData = await res.json();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setFetchingData(false);
    }
  };

  const handleGeneratePosts = async () => {
    if (!data) return;
    setGeneratingPosts(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, tone, count: 5 }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "投稿生成に失敗しました");
      }
      const result = await res.json();
      setPosts(result.posts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setGeneratingPosts(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold text-gray-900">
            SNS 自動投稿ジェネレーター
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            BigQuery のデータから X の投稿案を AI で自動生成
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 space-y-8">
        {/* Step 1: データ取得 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              1. データを取得
            </h2>
            <button
              onClick={handleFetchData}
              disabled={fetchingData}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {fetchingData ? "取得中..." : "BigQuery からデータ取得"}
            </button>
          </div>

          {data && <DataSummary data={data} />}
        </section>

        {/* Step 2: 投稿生成 */}
        {data && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                2. 投稿案を生成
              </h2>
              <GenerateButton
                tone={tone}
                onToneChange={setTone}
                onGenerate={handleGeneratePosts}
                loading={generatingPosts}
                disabled={!data}
              />
            </div>

            {posts.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}
