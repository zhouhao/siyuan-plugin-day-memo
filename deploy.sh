#!/bin/bash
TARGET="$HOME/SiYuan/data/plugins/siyuan-plugin-day-memo"
pnpm build && rm -rf "$TARGET" && mkdir -p "$TARGET" && cp -r dist/* "$TARGET/"
echo "Deployed to $TARGET"
