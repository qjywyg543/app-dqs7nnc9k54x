# 创建 GitHub 仓库步骤

## 第 1 步：登录 GitHub

1. 打开 https://github.com/login
2. 输入用户名：`qjywyg543`
3. 输入密码：`Sha110120`（注意大小写）
4. 点击 **Sign in**

## 第 2 步：创建仓库

1. 登录后，打开 https://github.com/new
2. 在 **Repository name** 输入框填写：
   ```
   app-dqs7nnc9k54x
   ```
3. 选择 **Public**（公开）或 **Private**（私有）
   - 推荐选 **Public**，免费且 Actions 运行更方便
4. 不要勾选「Add a README file」
5. 不要勾选「Add .gitignore」
6. 不要勾选「Choose a license」
7. 点击页面底部的 **Create repository** 按钮

## 第 3 步：创建 Personal Access Token（PAT）

GitHub 不再支持用密码推送代码，必须创建 Token：

1. 打开 https://github.com/settings/tokens/new
2. 在 **Note** 输入框填写：
   ```
   lottery app deploy
   ```
3. **Expiration** 选择：
   - `No expiration`（永不过期）
4. 勾选 **repo** 权限（如果是私有仓库，必须勾选）
5. 点击页面底部的 **Generate token** 按钮
6. 复制生成的 token（类似 `ghp_xxxxxxxxxxxxxxxxxxxx`）
   - **重要**：关闭页面后无法再次查看，必须先复制保存

## 第 4 步：推送代码

回到这个开发环境，执行以下命令：

```bash
cd /workspace/app-dqs7nnc9k54x
bash push-to-github.sh
```

按提示输入：

- 用户名：`qjywyg543`
- Token：上一步复制的 `ghp_xxxxxxxxx`

注意：输入 Token 时不会显示任何字符，这是正常的，输入完成后按回车即可。

## 第 5 步：等待构建

1. 推送成功后，打开 https://github.com/qjywyg543/app-dqs7nnc9k54x/actions
2. 你会看到工作流 **Build Android APK** 正在运行
3. 等待 10-20 分钟，直到所有任务显示绿色 ✅
4. 构建完成后，打开 https://github.com/qjywyg543/app-dqs7nnc9k54x/releases/latest

## 第 6 步：下载测试

1. 打开网站 `/download` 页面
2. 点击「下载安卓安装包」
3. 如果跳转到 GitHub Releases 并能下载 APK，说明成功

## 遇到问题

- 如果推送失败提示 `Repository not found`，请检查仓库是否已创建
- 如果提示 `Authentication failed`，请检查 Token 是否复制正确，是否勾选了 `repo` 权限
- 如果 Actions 构建失败，把错误截图发给我
