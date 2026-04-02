import { NextResponse } from "next/server";
import { generatePosts } from "@/lib/claude";
import type { GeneratePostsRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body: GeneratePostsRequest = await request.json();
    const { data, tone, count } = body;

    if (!data) {
      return NextResponse.json(
        { error: "データが指定されていません" },
        { status: 400 }
      );
    }

    const posts = await generatePosts(data, tone || "casual", count || 5);
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Post generation error:", error);
    const message =
      error instanceof Error ? error.message : "投稿生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
