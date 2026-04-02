import fs from "fs";
import path from "path";

// 月額コスト上限（USD）
const MONTHLY_COST_LIMIT = parseFloat(process.env.MONTHLY_COST_LIMIT || "10");

// Claude API 料金 (USD) - claude-sonnet-4-20250514
const PRICE_PER_INPUT_TOKEN = 3.0 / 1_000_000;   // $3 / 1M tokens
const PRICE_PER_OUTPUT_TOKEN = 15.0 / 1_000_000;  // $15 / 1M tokens

interface UsageRecord {
  month: string; // "2026-04"
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  requestCount: number;
  lastUpdated: string;
}

interface UsageData {
  records: UsageRecord[];
}

const USAGE_FILE = path.join(process.cwd(), ".usage.json");

function loadUsage(): UsageData {
  try {
    const raw = fs.readFileSync(USAGE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { records: [] };
  }
}

function saveUsage(data: UsageData): void {
  fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2));
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7); // "2026-04"
}

function getOrCreateMonthRecord(data: UsageData): UsageRecord {
  const month = getCurrentMonth();
  let record = data.records.find((r) => r.month === month);
  if (!record) {
    record = {
      month,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      requestCount: 0,
      lastUpdated: new Date().toISOString(),
    };
    data.records.push(record);
  }
  return record;
}

export function checkBudget(): { allowed: boolean; remaining: number; used: number; limit: number } {
  const data = loadUsage();
  const record = getOrCreateMonthRecord(data);
  const remaining = Math.max(0, MONTHLY_COST_LIMIT - record.totalCost);

  return {
    allowed: record.totalCost < MONTHLY_COST_LIMIT,
    remaining: Math.round(remaining * 100) / 100,
    used: Math.round(record.totalCost * 100) / 100,
    limit: MONTHLY_COST_LIMIT,
  };
}

export function recordUsage(inputTokens: number, outputTokens: number): void {
  const data = loadUsage();
  const record = getOrCreateMonthRecord(data);

  const cost =
    inputTokens * PRICE_PER_INPUT_TOKEN +
    outputTokens * PRICE_PER_OUTPUT_TOKEN;

  record.totalInputTokens += inputTokens;
  record.totalOutputTokens += outputTokens;
  record.totalCost += cost;
  record.requestCount += 1;
  record.lastUpdated = new Date().toISOString();

  saveUsage(data);
}

export function getUsageSummary(): {
  month: string;
  cost: number;
  limit: number;
  requests: number;
  inputTokens: number;
  outputTokens: number;
} {
  const data = loadUsage();
  const record = getOrCreateMonthRecord(data);

  return {
    month: record.month,
    cost: Math.round(record.totalCost * 100) / 100,
    limit: MONTHLY_COST_LIMIT,
    requests: record.requestCount,
    inputTokens: record.totalInputTokens,
    outputTokens: record.totalOutputTokens,
  };
}
