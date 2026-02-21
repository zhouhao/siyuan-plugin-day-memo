#!/bin/bash
TARGET="$HOME/SiYuan/data/plugins/siyuan-plugin-day-memo"
pnpm build && cp -f dist/* "$TARGET/"
echo "Deployed to $TARGET"
