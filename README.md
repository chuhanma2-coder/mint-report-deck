# Mint Report Deck

把粗略中文笔记、主题或附件整理成统一 Mint 风格的可交互 HTML 汇报材料。

这不是一个让 AI 自由写 HTML/CSS 的提示词包。Agent 只生成受控的 `deck.json`；模板、中文排版、组件、导航、编辑、图表互动和下载能力由 Skill 内置渲染器负责。

## 最简单的安装方式

把下面这个链接发给支持 Skill 的 Agent，并说：

> 帮我安装这个 Skill：  
> https://github.com/chuhanma2-coder/mint-report-deck/tree/main/skills/mint-report-deck

Codex 重新启动后即可使用。也可以在终端安装：

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo chuhanma2-coder/mint-report-deck \
  --path skills/mint-report-deck \
  --method git
```

## 日常使用

安装后，把粗略文字或附件发给 Agent：

> 使用 `$mint-report-deck`，根据下面的笔记直接生成一份 6 页 Mint 中文汇报。没有依据的数字不要补写，最后给我可下载并能直接改字的 HTML。

Agent 会完成内容提炼、页纲组织、图示选择、生成和校验。正式 HTML 支持：

- 键盘、滚轮、触屏翻页；
- 悬停导航查看每页标题；
- 点击图片或视频放大；
- 点击“✎”后修改页面文字；
- 互动图表的数值提示、图例筛选和时间窗口滑动；
- 下载修改后的单文件 HTML；
- 浏览器打印为 PDF。

如果结果需要修改，可以直接描述页码和问题，也可以截图后让 Agent 调整。

## 运行条件与边界

- 安装需要能访问 GitHub；使用时生成 HTML 只需要 Node.js 18+，不需要外接硬盘。
- 生成后的 `report.html` 可在现代 Chrome、Edge、Safari 中离线打开；在线字体加载失败时自动使用系统中文字体。
- Skill 不联网补写业务事实，不生成虚构图表，不输出可编辑 PPTX。
- 仓库不包含内部附件、历史汇报正文或真实经营数据。

## 开发验证

```bash
npm test
npm run example
```

核心知识借鉴了 MIT 许可的 [frontend-slides](https://github.com/zarazhangrui/frontend-slides)；具体采用范围和许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
