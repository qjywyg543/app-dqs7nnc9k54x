#!/usr/bin/env bash
set -e

# 使用说明：
# 1. 在 GitHub 创建 Personal Access Token（PAT）：
#    https://github.com/settings/tokens/new
#    勾选 repo 权限，生成 token（如 ghp_xxxxxx）
# 2. 运行脚本：
#    bash push-to-github.sh
# 3. 按提示输入 GitHub 用户名和 PAT

REPO="app-dqs7nnc9k54x"
REMOTE_URL="https://github.com/qjywyg543/${REPO}.git"

echo "========================================"
echo "  推送代码到 GitHub"
echo "========================================"
echo ""
echo "仓库地址: ${REMOTE_URL}"
echo ""

read -rp "请输入 GitHub 用户名: " USERNAME
read -rsp "请输入 GitHub Personal Access Token: " TOKEN
echo ""

AUTH_URL="https://${USERNAME}:${TOKEN}@github.com/${USERNAME}/${REPO}.git"

# 设置远程地址（如果已存在则更新）
if git remote | grep -q "origin"; then
  git remote set-url origin "${AUTH_URL}"
else
  git remote add origin "${AUTH_URL}"
fi

# 切换到 main 分支并推送
git branch -M main
git push -u origin main

echo ""
echo "✅ 推送完成！"
echo "接下来请访问：${REMOTE_URL}/actions"
echo "等待 GitHub Actions 自动构建 APK"
