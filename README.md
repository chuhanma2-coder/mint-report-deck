# Mint Report Deck V0.2

把粗略中文笔记编译为来源可追溯、最少页数的 Mint 管理层材料：互动 HTML 由内置渲染器生成；可编辑 PPTX 由 Codex `Presentations` Skill 使用内置组件母版生成。

## 安装

把本仓库链接发给支持 Skills 的 Agent，并说：

```text
帮我安装这个 Skill：https://github.com/chuhanma2-coder/mint-report-deck
```

Codex 也可以按其 Skill 安装流程从 GitHub 仓库安装。安装后重新打开任务或刷新 Skills 列表。

## 使用

```text
使用 Mint 汇报 Skill，把下面的粗略笔记生成可编辑 PPTX 和互动 HTML。
如果一页能讲清，就只做一页。只使用我提供的事实。

【材料主题】
……

【给谁看 / 希望推动什么】
……

【已知事实】
……

【下一步】
……
```

复杂监管、法律、资本、信贷、定价或客户政策材料会先列出待确认项。当前 Agent 没有 `Presentations` 时，只生成内容结构和 HTML，并明确提示 PPTX 未生成。

## 设计原则

- 先冻结事实和实体名称，再判断逻辑关系。
- 默认从一页开始，不机械拆页。
- 前台—中台—后台使用分层架构；并行路径使用双轨路线图；真实时间演进使用时间轴。
- 无完整数值、单位、期间、统计对象和来源时不生成图表。
- PPTX 与 HTML 共用 `content-map.json` 和 `deck-spec.json`。
