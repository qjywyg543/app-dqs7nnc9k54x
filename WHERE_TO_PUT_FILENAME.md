# 文件名填写位置说明

## 1. 打开创建 workflow 页面

1. 访问 https://github.com/qjywyg543/app-dqs7nnc9k54x/actions
2. 点击 **"set up a workflow yourself"** 蓝色链接

## 2. 填写文件名的位置

进入编辑页面后，你会看到：

- 页面最上方左侧有一个输入框，默认显示类似：`name.yml`
- 右侧是 **Commit changes...** 按钮

## 3. 在那个输入框里填写

```
.github/workflows/build-apk.yml
```

## 4. 填写内容的位置

- 输入框下方是一个较大的代码编辑区域
- 把 workflow 代码完整复制粘贴进去

## 5. 提交

- 点击右上角 **Commit changes...**
- 选择 **Commit directly to the main branch**
- 点击 **Commit changes**

## 示意图

```
┌─────────────────────────────────────────────────────────┐
│  .github/workflows/build-apk.yml  ← 这里填文件名          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1  name: Build Android APK                             │
│  2  on:                                                 │
│  3    push:                                             │
│  ...                                                    │
│                                                         │
│  ← 这里粘贴代码内容                                     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Commit changes...]  ← 填完后点这里提交                │
└─────────────────────────────────────────────────────────┘
```

## 注意

- 文件名必须完全一致，包括前面的 `.github/workflows/`
- 不要漏掉斜杠 `/`
- 文件名填好后，代码粘贴在下方的编辑框中
