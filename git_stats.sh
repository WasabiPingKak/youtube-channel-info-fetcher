#!/bin/bash

# 用法: ./git_stats.sh [作者名稱]
# 例如: ./git_stats.sh WasabiPingKak

AUTHOR="$1"

if [ -n "$AUTHOR" ]; then
  GIT_LOG_CMD="git log --author=\"$AUTHOR\" --pretty=format:\"commit %H\" --numstat"
else
  GIT_LOG_CMD="git log --pretty=format:\"commit %H\" --numstat"
fi

# 印出實際執行的 git log 指令
echo "[Run] $GIT_LOG_CMD"

# 執行並統計
eval $GIT_LOG_CMD | \
awk '
  /^commit / { commits++ }
  NF==3 { add += $1; del += $2; files[$3]=1 }
  END {
    printf "Commits: %s\nUnique files changed: %s\nInsertions(+): %s\nDeletions(-): %s\n", commits, length(files), add, del
  }
'
