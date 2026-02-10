#!/bin/bash
set -e

SERVER="ubuntu@100.81.120.37"  # Your Tailscale IP
REMOTE_DIR="~/cantrips"

echo "📦 Syncing source..."
rsync -avz --exclude node_modules --exclude .git \
  ./ $SERVER:$REMOTE_DIR/

echo "🔨 Building and restarting..."
ssh $SERVER "cd ~/cantrips && bun install && bun run dev"

echo "🔮 Deployed!"