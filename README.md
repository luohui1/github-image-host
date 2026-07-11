# GitHub + jsDelivr 免费图床

账号：`luohui1`  
仓库用途：把图片提交到本仓库的 `images/`，用 jsDelivr CDN 当外链。

## 链接格式

```text
https://cdn.jsdelivr.net/gh/<owner>/<repo>@<branch>/images/<filename>
```

示例（仓库创建并推送后）：

```text
https://cdn.jsdelivr.net/gh/luohui1/github-image-host@main/images/demo-20260711-142300.png
```

备用（不走 CDN）：

```text
https://raw.githubusercontent.com/<owner>/<repo>/<branch>/images/<filename>
```

## 上传图片

在仓库根目录执行：

```powershell
.\upload.ps1 .\你的图片.png
.\upload.ps1 C:\path\to\photo.jpg -Name avatar
```

脚本会：复制到 `images/` → `git commit` → `git push` → 打印并复制 jsDelivr 链接。

只提交不推送：

```powershell
.\upload.ps1 .\a.png -NoPush
```

## 限制（建议遵守）

- 单文件建议 **≤ 5MB**
- 适合个人博客 / 笔记 / 低频外链
- 不要当公开大流量图床（易触发 GitHub / jsDelivr 限制）
- 仓库请保持 **Public**，jsDelivr 才能稳定访问

## 手动上传

1. 把图片放进 `images/`
2. `git add` → `commit` → `push`
3. 按上面的 URL 规则拼链接

## 目录

```text
images/       # 图片存放
upload.ps1    # 一键上传脚本
```
