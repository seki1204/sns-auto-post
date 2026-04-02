"use client";

import { useState } from "react";
import type { GeneratedPost } from "@/lib/types";

interface Props {
  post: GeneratedPost;
}

const toneLabel: Record<string, string> = {
  casual: "カジュアル",
  formal: "フォーマル",
  "data-driven": "データ重視",
};

export default function PostCard({ post }: Props) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(post.text);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
          {toneLabel[post.tone] || post.tone}
        </span>
        <span className="text-xs text-gray-400">
          {text.length}文字
        </span>
      </div>

      {editing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          rows={4}
          maxLength={280}
        />
      ) : (
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
          {text}
        </p>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          {copied ? "コピー済み" : "コピー"}
        </button>
        <button
          onClick={() => setEditing(!editing)}
          className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          {editing ? "確定" : "編集"}
        </button>
      </div>
    </div>
  );
}
