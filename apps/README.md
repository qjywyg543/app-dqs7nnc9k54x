# 移动端 App

本目录包含两个 Expo 项目，用于将网站封装为 Android App。

## 项目结构

- `mobile-user/`：用户端安卓 App，打包后访问网站首页
- `mobile-admin/`：管理后台安卓 App，打包后访问 `/admin`

## 自动构建（推荐）

已配置 GitHub Actions，推送代码后自动构建并发布到 GitHub Releases。

1. 在 GitHub 创建仓库，将代码推送到 `main` 分支
2. 修改 `src/pages/Download.tsx` 中的 `GITHUB_USER` 和 `GITHUB_REPO` 为你的实际值
3. 推送代码，等待 GitHub Actions 完成
4. 构建完成后，访问 `/download` 页面即可下载 APK

## 手动构建

1. 进入对应目录：
   ```bash
   cd apps/mobile-user
   # 或
   cd apps/mobile-admin
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 预构建 Android 项目：
   ```bash
   npx expo prebuild --platform android
   ```

4. 构建 APK：
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

5. 构建完成后，APK 位于 `android/app/build/outputs/apk/release/app-release.apk`。

## 环境说明

- 两个 App 均使用 `react-native-webview` 加载现有网站
- 用户端 App 加载 `https://app-dqs7nnc9k54x.vercel.app`
- 管理后台 App 加载 `https://app-dqs7nnc9k54x.vercel.app/admin`
- 请确保网站已部署且可访问
