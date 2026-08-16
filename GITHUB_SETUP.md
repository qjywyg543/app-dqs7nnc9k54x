# 后续操作指南

## 第 1 步：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名填写：`app-dqs7nnc9k54x`
3. 选择 **Public**（公开）或 **Private**（私有）
4. 不要勾选「Initialize this repository with a README」，因为本地已有代码
5. 点击 **Create repository**

## 第 2 步：创建 Personal Access Token

GitHub 已不再支持用账号密码直接推送代码，需要创建 Token：

1. 访问 https://github.com/settings/tokens/new
2. 在 **Note** 中填写描述，例如：`lottery app deploy`
3. 过期时间选择 **No expiration**（永不过期）或自定义
4. 勾选权限：
   - ✅ `repo`（完整仓库权限）
5. 点击页面底部 **Generate token**
6. 复制生成的 token（类似 `ghp_xxxxxxxxxxxx`），**关闭页面后无法再查看**

## 第 3 步：推送代码

在项目根目录运行：

```bash
bash push-to-github.sh
```

按提示输入：

- GitHub 用户名：`qjywyg543`
- Personal Access Token：上一步复制的 token

脚本会自动：

1. 配置远程仓库
2. 切换到 `main` 分支
3. 推送代码到 GitHub

## 第 4 步：等待自动构建

1. 推送完成后，访问：https://github.com/qjywyg543/app-dqs7nnc9k54x/actions
2. 你会看到名为 **Build Android APK** 的工作流正在运行
3. 等待 10-20 分钟，直到所有任务显示绿色 ✅
4. 构建完成后，访问：https://github.com/qjywyg543/app-dqs7nnc9k54x/releases/latest

## 第 5 步：下载 APK

1. 打开你的网站 `/download` 页面
2. 点击「下载安卓安装包」或「下载管理后台安装包」
3. 会自动跳转到 GitHub Releases 下载最新 APK

## 注意事项

- 用户名、密码属于敏感信息，请勿在代码或公开平台泄露
- 本项目中不包含密码，只有用户名已写入 `src/pages/Download.tsx` 和 `apps/GITHUB_CONFIG.md`
- 如果仓库名不是 `app-dqs7nnc9k54x`，请修改 `src/pages/Download.tsx` 中的 `GITHUB_REPO`
