"use client";

import type { PostTone } from "@/lib/types";

interface Props {
  tone: PostTone;
  onToneChange: (tone: PostTone) => void;
  onGenerate: () => void;
  loading: boolean;
  disabled: boolean;
}

const tones: { value: PostTone; label: string }[] = [
  { value: "casual", label: "カジュアル" },
  { value: "formal", label: "フォーマル" },
  { value: "data-driven", label: "データ重視" },
];

export default function GenerateButton({
  tone,
  onToneChange,
  onGenerate,
  loading,
  disabled,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      <select
        value={tone}
        onChange={(e) => onToneChange(e.target.value as PostTone)}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        {tones.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <button
        onClick={onGenerate}
        disabled={loading || disabled}
        className="px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {loading ? "生成中..." : "投稿案を生成"}
      </button>
    </div>
  );
}
