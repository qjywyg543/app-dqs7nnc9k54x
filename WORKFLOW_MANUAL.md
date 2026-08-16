# 手动创建 GitHub Actions 工作流

因为 GitHub API 对 `.github/workflows` 目录有权限限制，需要你在 GitHub 网页上手动创建 workflow 文件。

## 步骤

1. 打开你的仓库页面：
   https://github.com/qjywyg543/app-dqs7nnc9k54x

2. 点击上方的 **Actions** 标签

3. 在 "Get started with GitHub Actions" 页面，点击：
   **set up a workflow yourself**（页面中间偏上的链接）

4. 在文件编辑页面，文件名填写：
   ```
   .github/workflows/build-apk.yml
   ```

5. 把下面的内容完整复制到编辑框中：

```yaml
name: Build Android APK

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-user:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
        working-directory: apps/mobile-user
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - name: Build APK
        run: eas build --platform android --profile preview --non-interactive
        working-directory: apps/mobile-user
      - name: Download APK
        run: |
          curl -L -o mobile-user.apk $(eas build:list --platform android --json --non-interactive --limit 1 | jq -r '.[0].artifacts.buildUrl')
        working-directory: apps/mobile-user
      - name: Upload to Release
        uses: softprops/action-gh-release@v1
        if: startsWith(github.ref, 'refs/tags/')
        with:
          files: apps/mobile-user/mobile-user.apk

  build-admin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
        working-directory: apps/mobile-admin
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - name: Build APK
        run: eas build --platform android --profile preview --non-interactive
        working-directory: apps/mobile-admin
      - name: Download APK
        run: |
          curl -L -o mobile-admin.apk $(eas build:list --platform android --json --non-interactive --limit 1 | jq -r '.[0].artifacts.buildUrl')
        working-directory: apps/mobile-admin
      - name: Upload to Release
        uses: softprops/action-gh-release@v1
        if: startsWith(github.ref, 'refs/tags/')
        with:
          files: apps/mobile-admin/mobile-admin.apk
```

6. 点击页面右上角 **Commit changes...** 按钮

7. 在弹窗中：
   - Commit message 填：`Add build workflow`
   - 选择 **Commit directly to the main branch**
   - 点击 **Commit changes**

8. 提交后会自动跳转到 Actions 页面，等待约 10-20 分钟

## 注意

- 这个 workflow 需要 EAS 账号，构建前需要在仓库 Settings → Secrets and variables → Actions 中添加 `EXPO_TOKEN`
- 如果你还没有 EAS token，可以去 https://expo.dev/settings/access-tokens 创建
- 如果不配置 EXPO_TOKEN，构建会失败

## 简单方案

如果你不想配置 EAS 账号，可以改用本地构建 APK。我会帮你写一份本地构建指南。
