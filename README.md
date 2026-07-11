# GitHub + jsDelivr 免费图床

账号：`luohui1`  
仓库：把图片放进 `images/`，用 jsDelivr 当 CDN；网页端可浏览 / 上传。

## 前端（GitHub Pages）

部署后访问：

```text
https://luohui1.github.io/github-image-host/
```

功能：
- **图库**：点击图片复制 jsDelivr 外链
- **上传**：拖拽上传（需在「设置」填 GitHub Token）
- **设置**：Token 只存在浏览器 localStorage

Token 创建：https://github.com/settings/tokens  
需要 `repo`（经典）或 Contents Read and write（细粒度）。

## 链接格式

```text
https://cdn.jsdelivr.net/gh/<owner>/<repo>@<branch>/images/<filename>
```

示例：

```text
https://cdn.jsdelivr.net/gh/luohui1/github-image-host@main/images/demo.svg
```

## 命令行上传

```powershell
cd D:\Flies\github-image-host
.\upload.ps1 .\你的图片.png
.\upload.ps1 C:\path\to\photo.jpg -Name avatar
```

脚本会更新 `images/manifest.json`，供前端图库读取。

## 限制

- 单文件建议 ≤ 5MB
- 适合个人低频外链
- 仓库保持 **Public**

## 目录

```text
index.html / assets/   # 前端
images/                # 图片 + manifest.json
upload.ps1             # 命令行上传
```
