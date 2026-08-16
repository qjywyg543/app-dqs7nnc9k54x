# 仓库已创建，下一步：创建 Token 并推送代码

## 第 1 步：创建 Personal Access Token

1. 打开 https://github.com/settings/tokens/new
2. 在 **Note** 输入框填写：
   ```
   lottery app deploy
   ```
3. 在 **Expiration** 选择：
   ```
   No expiration
   ```
4. 勾选权限：
   - ✅ `repo`（完整仓库权限）
5. 点击页面底部 **Generate token**
6. 复制生成的 token（类似 `ghp_xxxxxxxxxxxxxxxxxxxx`）
   - **重要**：关闭页面前必须先复制，关闭后无法再次查看

## 第 2 步：推送代码

在开发环境中执行：

```bash
cd /workspace/app-dqs7nnc9k54x
bash push-to-github.sh
```

按提示输入：

- 用户名：`qjywyg543`
- Token：刚才复制的 `ghp_xxxxxxxx...`

> 注意：输入 Token 时不会显示任何字符，这是正常的，输入完按回车即可。

## 第 3 步：验证推送

推送成功后，打开：
https://github.com/qjywyg543/app-dqs7nnc9k54x

应该能看到代码已经上传到仓库。

## 第 4 步：等待构建

1. 打开 https://github.com/qjywyg543/app-dqs7nnc9k54x/actions
2. 等待工作流 **Build Android APK** 运行完成（约 10-20 分钟）
3. 全部变成绿色 ✅ 后，访问 https://github.com/qjywyg543/app-dqs7nnc9k54x/releases/latest

## 第 5 步：下载测试

打开网站 `/download` 页面，点击下载按钮测试是否能下载 APK。
