import { NextResponse } from "next/server";
import { getUsageSummary } from "@/lib/usage-tracker";

export async function GET() {
  try {
    const summary = getUsageSummary();
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "使用量取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
