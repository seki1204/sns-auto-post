#!/bin/bash
# SNS自動投稿ジェネレーター 起動スクリプト
cd "$(dirname "$0")"

# .env.local から環境変数を読み込む
set -a
source .env.local 2>/dev/null
set +a

npx next dev --port 3001
