# 后台排序与文章封面任务

**目标：** 让写作台默认按发布时间倒序展示文章，并为全部现有文章补齐可在前台展示的通用主题封面。

## 阶段

* [complete] 1. 核对文章元数据、Sveltia 排序语法和可用图像生成能力。
* [complete] 2. 生成并检查通用分类封面资产。
* [complete] 3. 配置后台发布时间排序，并按分类回填 35 篇文章的封面字段。
* [complete] 4. 运行目标测试、Astro 诊断和生产构建验证。
* [complete] 5. 导入用户提供的 14 张分类 PNG，替换现有文章的临时 SVG 封面并验证展示。

## 约束

* 后台排序使用文章 Frontmatter 的 `published` 字段，默认降序。
* 封面放在 `public/media/uploads/covers/`，文章引用以 `/media/uploads/covers/` 开头。
* 不修改文章正文、标题、日期或分类。

## 已知错误

* `infsh` 未安装，需采用可用的图像生成途径或安装后认证。
* `npx @inference-sh/cli --version` 返回 npm 404；该包名不可用，下一步读取官方安装命令，避免重试同一方式。
* 正确 CLI 为 `npx @inferencesh/belt`，但默认 npm 缓存含 root 所有文件导致 `EPERM`；下一步使用会话临时缓存，不使用 sudo 或改动用户目录权限。
* 临时安装脚本的首次执行未生成二进制文件：`INSTALL_DIR=... curl | bash` 仅将变量传给 curl，未传给 bash。下一步需先 `export INSTALL_DIR` 再执行脚本。
* 即使导出 `INSTALL_DIR`，belt CLI 临时安装仍未留下二进制文件；已停止继续该路径，并以仓库内 SVG 作为稳定、无文字乱码的通用封面资产。
