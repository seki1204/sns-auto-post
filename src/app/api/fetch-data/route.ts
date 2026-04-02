import { NextResponse } from "next/server";
import { fetchAllData, getMockData } from "@/lib/bigquery";

export async function POST() {
  try {
    // BigQueryが設定されていない場合はモックデータを返す
    if (!process.env.BIGQUERY_PROJECT_ID) {
      return NextResponse.json(getMockData());
    }

    const data = await fetchAllData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("BigQuery fetch error:", error);
    const message = error instanceof Error ? error.message : "データ取得に失敗しました";

    // BigQuery接続エラー時はモックデータにフォールバック
    if (message.includes("BIGQUERY") || message.includes("credentials")) {
      console.warn("BigQuery未接続のためモックデータを使用します");
      return NextResponse.json(getMockData());
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
