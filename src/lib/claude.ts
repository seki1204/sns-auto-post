import Anthropic from "@anthropic-ai/sdk";
import type { BigQueryData, PostTone, GeneratedPost } from "./types";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY が設定されていません");
  }
  return new Anthropic({ apiKey });
}

const toneLabels: Record<PostTone, string> = {
  casual: "カジュアル・親しみやすい",
  formal: "フォーマル・ビジネス向け",
  "data-driven": "データ重視・具体的な数値を含む",
};

function buildPrompt(data: BigQueryData, tone: PostTone, count: number): string {
  const latest = data.traffic[0];

  const trafficSummary = latest
    ? `
【トラフィック概要 (${latest.date})】
- 総ユーザー数: ${latest.totalUsers.toLocaleString()}
- 新規ユーザー: ${latest.newUsers.toLocaleString()}
- セッション数: ${latest.sessions.toLocaleString()}
- ページビュー: ${latest.pageviews.toLocaleString()}
- 平均エンゲージメント時間: ${Math.round(latest.avgEngagementTime)}秒
- エンゲージメント率: ${(latest.engagementRate * 100).toFixed(1)}%`
    : "トラフィックデータなし";

  const topPagesSummary = data.topPages.length > 0
    ? `
【人気ページ TOP5】
${data.topPages.slice(0, 5).map((p, i) => `${i + 1}. ${p.page} (${p.pageviews}PV / ${p.users}ユーザー)`).join("\n")}`
    : "";

  const topEventsSummary = data.topEvents.length > 0
    ? `
【主要イベント】
${data.topEvents.slice(0, 5).map((e) => `- ${e.eventName}: ${e.count.toLocaleString()}回 (${e.users}ユーザー)`).join("\n")}`
    : "";

  const sourcesSummary = data.trafficSources.length > 0
    ? `
【流入元】
${data.trafficSources.slice(0, 5).map((s) => `- ${s.source} / ${s.medium}: ${s.users}ユーザー`).join("\n")}`
    : "";

  return `あなたはウェブアナリティクス企業「WACA」のSNSマーケティング担当者です。
WACAのサイト (waca.associates/jp) のGA4データを元に、X(Twitter)に投稿する文章を${count}パターン作成してください。

${trafficSummary}
${topPagesSummary}
${topEventsSummary}
${sourcesSummary}

【要件】
- トーン: ${toneLabels[tone]}
- 各投稿は140文字以内（日本語）
- ハッシュタグは1〜2個まで（#ウェブ解析 #WACA #GA4 #アクセス解析 など適切なものを選択）
- サイトのデータやトレンドから導き出せるインサイトを投稿に反映すること
- ウェブ解析やデジタルマーケティングの専門家としての視点を含めること
- 宣伝臭くなく、フォロワーにとって価値のある情報や気づきを提供すること

以下のJSON形式で出力してください（他のテキストは不要）:
[
  { "text": "投稿文1" },
  { "text": "投稿文2" }
]`;
}

export async function generatePosts(
  data: BigQueryData,
  tone: PostTone,
  count: number = 5
): Promise<GeneratedPost[]> {
  const client = getClient();
  const prompt = buildPrompt(data, tone, count);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Claude APIの応答からJSONを抽出できませんでした");
  }

  const posts: { text: string }[] = JSON.parse(jsonMatch[0]);

  return posts.map((post, index) => ({
    id: `${Date.now()}-${index}`,
    text: post.text,
    tone,
    createdAt: new Date().toISOString(),
  }));
}
