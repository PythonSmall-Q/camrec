# ⚠️ 首次使用必读

## 📝 需要修改的地方

在使用 GitHub Actions 自动发布功能之前，请替换以下文件中的占位符：

### 1. package.json
位置：`package.json` 第 10 行

```json
"repository": {
  "type": "git",
  "url": "https://github.com/你的用户名/camrec.git"
}
```

替换为：
```json
"repository": {
  "type": "git",
  "url": "https://github.com/实际用户名/camrec.git"
}
```

### 2. README.md
位置：`README.md` 第 3-5 行

替换所有的 `你的用户名` 为实际的 GitHub 用户名：

```markdown
[![Build and Release](https://github.com/你的用户名/camrec/actions/workflows/release.yml/badge.svg)]...
```

## 🔍 快速查找

在项目中搜索 `你的用户名`，替换为实际的 GitHub 用户名。

在 VS Code 中：
1. 按 `Ctrl + Shift + H` 打开查找和替换
2. 查找：`你的用户名`
3. 替换为：你的实际 GitHub 用户名
4. 点击"全部替换"

## ✅ 验证

替换完成后，检查：
- [ ] `package.json` 中的 repository.url
- [ ] `README.md` 中的所有 badge 链接
- [ ] 所有文档中的示例链接

## 📚 下一步

1. 提交修改：
   ```bash
   git add .
   git commit -m "chore: update repository URLs"
   git push origin main
   ```

2. 配置 GitHub Actions：
   阅读 [.github/SETUP.md](.github/SETUP.md)

3. 测试发布：
   阅读 [RELEASE_GUIDE.md](RELEASE_GUIDE.md)

---

**提示**：如果你 fork 了这个项目，GitHub 会自动识别你的用户名，但仍建议手动检查确认。
