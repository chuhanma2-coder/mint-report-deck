# Mint Report Deck V0.6 Action Plan

> 本文件是 V0.6 重构的唯一执行清单，不是总结文档。除修复阻断测试所必需的最小改动外，不得实施未列入本文件的功能。任何新增需求必须先加入“需求覆盖矩阵”和对应 Action Item，再修改代码。

## 0. 执行纪律

### 状态定义

- `TODO`：尚未开始，不得提前修改该任务专属文件。
- `IN PROGRESS`：当前唯一允许实施的任务。
- `DONE`：代码、规定测试、结果记录和验收标准全部通过。
- 任一时刻最多一个 Action Item 为 `IN PROGRESS`。

### 单项执行循环

每个 Action Item 必须依次完成：

1. 将本文件中该项状态从 `TODO` 改为 `IN PROGRESS`。
2. 记录开始前的相关测试基线；不得覆盖或清理现有未提交改动。
3. 只修改该项“涉及文件/模块”列出的文件。需要扩展范围时，先更新本文件。
4. 执行该项规定的单元、契约和回归测试。
5. 在该项“测试结果”中记录命令、退出码、通过数、失败数和产物路径。
6. 对照验收标准逐条确认；任何一条不满足都不得标记 `DONE`。
7. 将状态改为 `DONE`，再进入下一项。

禁止一次性完成多个 Action Item 后统一测试。禁止通过降低阈值、删除失败样例或隐藏 QA 警告让测试通过。

### 回滚纪律

- 每项改动必须保持任务边界清晰；发生失败时只撤回本项补丁，不得使用 `git reset --hard`、不得还原用户已有改动。
- 新 Schema、Contract 和 Renderer 必须先以并行版本接入；旧 V0.4/V0.5 路径至少保留到 `P1-10` 全量验收通过。
- 新输出应写入新的测试目录，不覆盖历史交付物。
- 新增第三方依赖前必须记录许可证、版本、校验方式和项目级缓存路径。

## 1. 总体状态

| ID | Action Item | 状态 | 依赖 |
|---|---|---|---|
| META-00 | 建立唯一执行清单 | DONE | 无 |
| P0-01 | 语义关系 Schema | DONE | META-00 |
| BASE-01 | 对齐 V0.5 开发基线与 WD 运行源 | DONE | P0-01 |
| P0-02 | 中文关系识别与证据编译 | DONE | P0-01, BASE-01 |
| P0-03 | Arrow / Connector Contract | DONE | P0-01, P0-02 |
| P0-04 | Page Contract 与整份材料叙事计划 | DONE | P0-01, P0-02 |
| P0-05 | Layout Pattern Registry | DONE | P0-03, P0-04 |
| P0-06 | Layout 兼容筛选、评分与选择解释 | DONE | P0-05 |
| P0-07 | Semantic / Reading Contract QA | DONE | P0-03, P0-04, P0-06 |
| P0-08 | 真正的一键 PDF 生成与下载 | DONE | P0-04 |
| P0-09 | 周报与知识库垂直回归 | DONE | P0-07, P0-08 |
| P1-01 | 约束式页面布局模型 | DONE | P0-05, P0-06 |
| P1-02 | HTML Renderer 按 Pattern 解耦 | DONE | P1-01 |
| P1-03 | 阅读顺序、重心与碎片化 QA | DONE | P1-01, P1-02 |
| P1-04 | 密度、有效留白与容量 QA | DONE | P1-01, P1-02 |
| P1-05 | 中文 CJK 排版与溢出 QA | DONE | P1-01, P1-02 |
| P1-06 | 自动修复与阻断编排 | DONE | P0-07, P1-03, P1-04, P1-05 |
| P1-07 | 整份材料版式节奏与章节一致性 | DONE | P0-06, P1-03, P1-04 |
| P1-08 | 可编辑 PPTX 确定性输出 | DONE | P0-04, P0-05, P1-01, P1-05 |
| P1-09 | HTML / PDF / PPTX 跨输出一致性 | IN PROGRESS | P0-08, P1-08 |
| P1-10 | 30+ 语义回归与 10 页盲测 | TODO | P1-06, P1-07, P1-09 |
| P2-01 | Mint 视觉细节统一 | TODO | P1-10 |
| P2-02 | Skill 文档、安装包与发布验收 | TODO | P2-01 |

## 2. Action Items

### META-00 建立唯一执行清单

- **目标**：把已经确认的内容理解、页面编排、中文排版、QA、PDF/PPTX导出要求转成可追踪任务，阻止 Coding Agent 自行改变范围。
- **涉及文件/模块**：新增仓库根目录 `ACTION_PLAN.md`。
- **具体改动**：建立状态机、单项执行循环、任务依赖、验收标准、回归案例和需求覆盖矩阵。
- **输入与输出**：输入为已确认的 V0.6 架构和用户反馈；输出为本文件。
- **依赖关系**：无。
- **测试方式**：检查每项是否包含目标、文件、改动、输入输出、依赖、测试、验收、案例、风险回滚、状态；检查需求覆盖矩阵是否无空项。
- **验收标准**：所有后续需求均能映射到至少一个 Action Item；只有本项为 `DONE`，所有代码任务均为 `TODO`。
- **回归测试案例**：本轮用户列出的十五部分需求逐项映射。
- **风险与回滚方案**：本文件不进入 Skill 分发目录，不影响运行时；若结构不完整，仅修改本文件。
- **完成状态**：`DONE`
- **测试结果**：`PASS`。共22个Action Item；每项11个必填字段均存在；仅META-00为`DONE`，其余21项为`TODO`；需求覆盖矩阵无空映射；本轮未修改功能代码。

### P0-01 语义关系 Schema

- **目标**：解决关系只有一个粗粒度字符串、无法表达成员、方向、依据、置信度和连接方式的问题。
- **涉及文件/模块**：新增 `skills/mint-report-deck/schemas/semantic-graph.schema.json`、`references/semantic-relation-contract.md`、`scripts/validate-semantic-graph.mjs`、`tests/semantic-graph.schema.mjs`、`tests/fixtures/semantic-graph-valid.json`、`tests/fixtures/semantic-graph-invalid.json`；修改 `references/content-map-contract.md`、`scripts/migrate-content-map.mjs`、`scripts/validate-content-map.mjs`。
- **具体改动**：
  - 新增 `semanticGraph.nodes[]` 与 `semanticGraph.edges[]`。
  - 关系类型限定为 `parallel`、`sequence`、`temporal`、`causal`、`comparison`、`hierarchy`、`composition`、`flow`、`evidence`、`before-after`、`problem-cause-solution`。
  - Edge 必须包含 `source`、`target`、`relationType`、`direction`、`evidenceRefs`、`confidence`、`orderBasis`、`connectorPolicy`。
  - 支持旧 `relationships[]` 迁移，但迁移器只能标记 `needsReview`，不得猜造有向边。
- **输入与输出**：输入为 `content-map.json` V0.4/V0.5；输出为通过 Schema 的 V0.6 `content-map.json` 和独立 `semantic-graph.json`。
- **依赖关系**：META-00。
- **测试方式**：新增 Schema 正反样例；运行 `node scripts/validate-semantic-graph.mjs fixture.json`；运行现有 V0.4/V0.5 fixture 迁移测试。
- **验收标准**：关系节点引用有效；有向关系必须有依据；并列关系不生成有向边；缺失证据的因果关系被标记为假设或阻断；旧 fixture 不丢失原始信息。
- **回归测试案例**：
  - “覆盖140页、分析扩展到成本、交付改为全量复查”识别为三个并列升级。
  - “识别变化→保留证据→转成Mint检查项”识别为有序流程。
  - “第一、第二、第三”但互不依赖的三项不得自动变成流程。
- **风险与回滚方案**：保留旧字段读取器；新 Schema 仅在 `schemaVersion >= 0.6` 时强制；失败时回退到 `needs-semantic-review`，不得回退为自动流程。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。`node skills/mint-report-deck/tests/semantic-graph.schema.mjs` 退出码0：3个有效图通过、1个错误图被阻断、旧关系保留1条、猜造旧有向边0条、既有数字声明及公式保留9条；`npm test` 退出码0：22个路由案例、32个提示词案例、66次确定性运行、6份渲染材料及现有严格阻断/修复/一页合同测试全部通过。

### BASE-01 对齐 V0.5 开发基线与 WD 运行源

- **目标**：解决 GitHub 工作副本已包含 V0.5 中文编译能力、WD 安装运行源仍为 V0.4.1 的基线分叉；后续任务必须在不丢失 P0-01 的前提下基于同一代码继续。
- **涉及文件/模块**：本地 `/Users/mac/Documents/Mint/mint-report-deck-release/skills/mint-report-deck/` 的现有 V0.5 修改和新增文件；WD `/Volumes/WD-Dev/Projects/微众工作/mint-report-deck/skills/mint-report-deck/` 对应文件；`ACTION_PLAN.md`；备份目录 `.work/v06-baseline-backup/`。P0-01 的 `schemas/semantic-graph.schema.json`、`semantic-relation-contract.md`、`validate-semantic-graph.mjs`、迁移器与测试不得被覆盖。
- **具体改动**：先保存 WD 相关文件副本和差异清单；将本地 V0.5 新增模块与非冲突修改机械同步到 WD；对 `content-map-contract.md` 和 `validate-content-map.mjs` 执行人工合并，保留 V0.5 discourse/narrative 合同与 V0.6 semanticGraph 合同；同步后不删除任一侧文件。
- **输入与输出**：输入为本地 V0.5 工作副本、WD V0.4.1+P0-01；输出为 WD 上统一的 V0.5+P0-01 基线及备份/差异记录。
- **依赖关系**：P0-01。
- **测试方式**：运行 `npm test`、`node skills/mint-report-deck/tests/semantic-graph.schema.mjs`；检查 `SKILL.md` 为V0.5、中文编译fixture存在、P0-01 schema/validator存在；比较关键文件hash并确认无计划外删除。
- **验收标准**：WD同时具备V0.5中文编译/渲染合同和P0-01语义图能力；两组测试均通过；本机Skill符号链接读取到统一版本；备份可恢复；GitHub尚未推送。
- **回归测试案例**：V0.5 `chinese-narrative-*` fixtures、既有Vodafone/巴基斯坦/股权/强制一页fixtures、P0-01语义图正反与迁移fixture。
- **风险与回滚方案**：同步前复制所有目标文件到 `.work/v06-baseline-backup/`；只覆盖清单内文件，不运行删除同步；失败时逐文件恢复备份，不使用`git reset --hard`。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。WD 运行源已升级为V0.5并保留P0-01；22个非冲突文件与GitHub工作副本逐文件一致，16个覆盖目标已有 `.work/v06-baseline-backup/` 备份；V0.5中文编译fixture和P0-01语义图fixture均存在；`npm test` 退出码0（8份渲染材料、7个严格阻断、6个叙事合同），语义图测试退出码0。

### P0-02 中文关系识别与证据编译

- **目标**：提高中文段落、枚举、指代、转折、递进和因果的识别准确度，避免把编号误当流程、把对比误当能力链。
- **涉及文件/模块**：新增 `scripts/compile-semantic-graph.mjs`、`references/chinese-discourse-markers.json`、`tests/fixtures/semantic-minimal-pairs.json`、`tests/chinese-relations.mjs`；重构 `references/chinese-content-compiler.md`、`scripts/validate-chinese-compilation.mjs`。
- **具体改动**：
  - 先拆分 discourse unit，再识别主体、谓词、对象、时间、模态和关系标记。
  - 区分枚举标记“第一/第二/第三”和顺序标记“首先/随后/完成后/最终”。
  - 只有输出进入下一节点、时间先后或显式依赖成立时才建立 sequence/flow edge。
  - “相比V1、V2”“原来/现在”“改变了什么”优先形成 comparison/before-after。
  - 所有自动关系输出 `evidenceRefs` 和 `confidence`；低置信度进入待确认，不得强行选版式。
- **输入与输出**：输入为规范化中文原始笔记和 source refs；输出为 discourse units、semantic graph、识别警告。
- **依赖关系**：P0-01、BASE-01。
- **测试方式**：最小对照句对测试、真实段落回归、三次确定性运行；比较预期关系类型、边数量、方向和证据。
- **验收标准**：最小句对100%通过；并列/顺序关键回归误判为0；未解析主语不被猜造；同一输入三次结果一致。
- **回归测试案例**：周报三项升级、客户评论处理流程、知识库V1/V2对比、三级复核方案、MCP八项并列能力。
- **风险与回滚方案**：规则输出与LLM语义建议分层保存；规则冲突时停止路由而非覆盖原文；保留 V0.5 compiler 作为只读对照。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。`node tests/chinese-relations.mjs` 退出码0：7组最小关系对照、21次确定性运行、15条关系边、并列错误箭头0；覆盖中文括号编号、真实评论流程、非动作序词、V1/V2、三级复核因果假设、跨章节未知主语及8项MCP并列。P0-01语义图测试和`npm test`均再次通过。

### P0-03 Arrow / Connector Contract

- **目标**：确保箭头、流程线、轴线和分支线只表达真实语义，不再把并列内容画成流程。
- **涉及文件/模块**：新增 `references/connector-contract.md`、`scripts/validate-connector-contract.mjs`、`tests/connector-contract.mjs`、`tests/fixtures/connector-contract-valid.json`、`tests/fixtures/connector-contract-invalid.json`；修改 `references/component-contract.md`、`references/deck-schema.md`、`scripts/validate-deck.mjs`。
- **具体改动**：
  - 每个视觉连接器必须声明 `relationRef`、`connectorType`、`direction`。
  - `parallel` 默认 `connectorPolicy=none`；中心分支可用无方向 branch line，不得使用箭头。
  - `sequence/temporal/flow` 仅在 semantic edge 存在时允许箭头。
  - `causal` 必须区分已证实和假设，不得用箭头制造确定性。
- **输入与输出**：输入为 semantic graph 和 page draft；输出为通过合同的 connector plan 或阻断错误。
- **依赖关系**：P0-01、P0-02。
- **测试方式**：构造 parallel+arrow、sequence-no-edge、causal-no-evidence 等负例；构造真实流程正例。
- **验收标准**：并列+箭头100%阻断；所有箭头都有有效 `relationRef`；删除装饰性箭头不影响页面信息完整性。
- **回归测试案例**：周报三项升级无箭头；客户评论链路有三段方向；MCP能力只读列表不使用流程箭头。
- **风险与回滚方案**：渲染器忽略无合法 relationRef 的连接器；旧页面先记录 warning，V0.6 正式输出改为 hard fail。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。`node tests/connector-contract.mjs` 退出码0：1个合法流程连接器通过，8项错误被阻断，其中并列/箭头相关错误4项、未知端点错误1项；同时覆盖未授权可见连接器和不存在的 `relationRef`。V0.6 页面必须注册 `elementIds[]`，连接器类型必须服从语义边 `connectorPolicy`。随后 `chinese-relations.mjs`、`semantic-graph.schema.mjs` 与 `npm test` 全部退出码0；旧V0.5回归保持通过。

### P0-04 Page Contract 与整份材料叙事计划

- **目标**：在选版式前明确每页问题、答案、证据、叙事角色、阅读路径和页数合同；解决空白页、随意拆页和三章节风格漂移。
- **涉及文件/模块**：新增 `schemas/page-contract.schema.json`、`scripts/build-page-contracts.mjs`、`scripts/validate-page-contracts.mjs`；修改 `references/deck-planning.md`、`references/deck-schema.md`、`scripts/validate-page-budget.mjs`。
- **具体改动**：
  - 每页强制包含 `pageQuestion`、`pageAnswer`、`pageRole`、`proofObject`、`atomRefs`、`relationGraphRefs`、`readingAxis`、`contentOrder`、`focalAnchor`、`densityProfile`。
  - 先生成整份材料 narrative spine 和 section plan，再生成逐页合同。
  - 明确一页/最少页数/可拆页合同；一页强制要求下只能重组或阻断，不能生成第二页。
  - 每页必须至少一个 primary atom 和一个可见 proof object；禁止空内容页。
- **输入与输出**：输入为 content map、semantic graph、audience、decision、page budget；输出 `deck-plan.json` 和逐页 `pageContracts[]`。
- **依赖关系**：P0-01、P0-02。
- **测试方式**：验证 exact-one-page、三章节整份汇报、短内容一页、空页负例；检查 atom coverage 和 narrative transition。
- **验收标准**：空页为0；每页能回答“第一眼/第二眼/第三眼看什么”；强制一页不拆页；同类章节引言采用一致 family 和信息结构。
- **回归测试案例**：Vodafone一页、巴基斯坦一页、三章节完整汇报、周报+知识库五页材料。
- **风险与回滚方案**：保留旧 `deck-spec.slides`，新 page contract 先作为旁路产物；未通过时禁止进入 V0.6 renderer。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。`node tests/page-contracts.mjs` 退出码0：强制一页合同1个并保留4个主要信息原子；非法拆页1例被阻断；两页连续叙事通过；三组章节引言保持同一 family、阅读轴和内容顺序；空内容页1例被阻断。页面合同已接入 `validate-deck.mjs`，V0.6 最终页面的id、标题、问题、答案和主要信息必须与合同一致。随后连接器、中文关系、语义图和 `npm test` 全部退出码0。

### P0-05 Layout Pattern Registry

- **目标**：从少数固定模板升级为具有明确语义适用范围、容量和连接规则的版式语法库。
- **涉及文件/模块**：新增 `assets/layout-patterns.json`、`references/layout-pattern-registry.md`、`scripts/validate-pattern-registry.mjs`；重构 `assets/component-routing.json`、`scripts/plan-page-family.mjs`。
- **具体改动**：
  - 每个 Pattern 声明支持的 relation types、节点数量、数据形状、密度范围、阅读轴、必需区域、可选区域、connector policy、HTML/PPTX renderer key。
  - 首批至少包含 hero、split-evidence、parallel-columns、parallel-bands、radial-branches、horizontal-sequence、vertical-sequence、timeline、before-after、comparison、problem-cause-solution、hierarchy、numeric-story、chart-insight、risk-decision、media-evidence。
  - 卡片矩阵只用于真正独立的2–4项并列信息，不作为默认兜底。
  - 无兼容Pattern时返回 `needs-layout-review`，不得强塞表格或自由CSS。
- **输入与输出**：输入为 pattern definitions；输出为校验后的 registry 和候选Pattern集合。
- **依赖关系**：P0-03、P0-04。
- **测试方式**：Registry Schema校验；对每个Pattern运行一个正例和至少一个不兼容负例。
- **验收标准**：用户列出的20种页面表达均能映射到一个Pattern或明确变体；无Pattern允许无依据箭头；无通用“万能卡片页”。
- **回归测试案例**：三栏并列、流程、时间轴、Before/After、数据+结论、图片+文字、层级、总结页。
- **风险与回滚方案**：旧 recipe 保留为 legacy registry 条目；新Pattern逐个启用 feature flag，单项失败可关闭。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。`node tests/pattern-registry.mjs` 退出码0：22种Layout Pattern、22个能力标签、22个正例和22个不兼容负例全部通过；授权并列箭头的Pattern为0；通用fallback为null；`card-matrix`仅允许2–4项真正独立并列内容。兼容桥接确认前中后台能力链可获得 `layered-capability-chain` 候选。连接器、页面合同、中文关系、语义图和`npm test`再次全部通过。

### P0-06 Layout 兼容筛选、评分与选择解释

- **目标**：保证先按语义硬筛选，再按容量和叙事需要评分；版式多样性不能覆盖语义正确性。
- **涉及文件/模块**：新增 `scripts/select-layout.mjs`、`scripts/score-layout-candidates.mjs`；重构 `scripts/select-component.mjs`；新增 `tests/fixtures/layout-selection-cases.json`。
- **具体改动**：
  - 硬筛选：relation、cardinality、connector、data shape、page role、required zones。
  - 评分：语义匹配50%、容量20%、proof object 15%、deck rhythm 10%、媒体适配5%。
  - 输出 `selectionReason`、各候选分数、淘汰原因；同分时才考虑版式变化。
  - 相同输入三次必须选择相同Pattern。
- **输入与输出**：输入为 page contract、semantic graph、registry、相邻页面摘要；输出为选定Pattern、候选排名和解释。
- **依赖关系**：P0-05。
- **测试方式**：golden routing cases、确定性三跑、错误版式负例；比较选择解释是否引用真实关系。
- **验收标准**：并列不选sequence；before-after不选capability-chain；真实流程选有方向Pattern；所有选择均可解释；无兼容候选时阻断。
- **回归测试案例**：周报五页各自预期Pattern；股权公式页；三层合作架构；纯文字风险页。
- **风险与回滚方案**：保留 `select-component.mjs` 作为 legacy adapter；新选择器输出失败时不得静默调用旧选择器，只能明确回退到人工复核。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。`node tests/layout-selection.mjs` 退出码0：15类页面路由、45次重复运行结果稳定，1个无兼容Pattern用例被阻断，并列误选sequence为0、Before/After误选能力链为0。选择器先按relation、节点数、data shape、page role、reading axis和connector policy硬筛选，再按50/20/15/10/5权重评分并输出淘汰原因；无兼容项不得回退到表格或卡片。所有上游专项与`npm test`再次通过。

### P0-07 Semantic / Reading Contract QA

- **目标**：在渲染前阻断语义连接错误、无明确阅读路径、无主视觉或信息缺失的页面。
- **涉及文件/模块**：新增 `scripts/validate-semantic-layout.mjs`、`scripts/validate-reading-contract.mjs`；重构 `scripts/qa-deck.mjs`、`scripts/validate-narrative-contract.mjs`、`scripts/validate-component-contract.mjs`。
- **具体改动**：
  - 检查 relation→Pattern 兼容性、connector relationRef、contentOrder完整性、唯一focalAnchor、primary atom覆盖。
  - 阅读轴限定为 `left-to-right`、`top-to-bottom`、`center-out` 或明确编号路径。
  - QA状态分为 `formal-ready`、`repair-required`、`blocked`；语义错误不得仅warning。
- **输入与输出**：输入为 content map、semantic graph、deck plan、page contracts、layout selections；输出结构化 `qa-report.json`。
- **依赖关系**：P0-03、P0-04、P0-06。
- **测试方式**：正反合同样例；故意插入错误箭头、缺失节点、两个阅读起点、无主视觉等问题。
- **验收标准**：并列箭头、无证据因果、空页、无阅读顺序、主信息遗漏均被阻断；现有 QA 不得在这些错误上继续“通过”。
- **回归测试案例**：当前 `2026-08-18-weekly-kb-v05-test` 的已知错误版本必须失败；修正后的合同必须通过。
- **风险与回滚方案**：QA模块独立运行，不改旧HTML；发生误报时修正规则或fixture，禁止删除检查项。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。`node tests/semantic-layout-qa.mjs` 退出码0：合法语义与阅读合同通过；错误Pattern 1例、错误阅读顺序/缺失focal anchor 1例、已知 `2026-08-18-weekly-kb-v05-test` 旧错误版本1例均被阻断。`qa-deck.mjs` 对V0.6新增 semantic-layout 与 reading-contract 检查，状态分为formal-ready、repair-required和blocked；语义错误为hard fail。全套P0-01至P0-06专项与`npm test`再次全部通过。

### P0-08 真正的一键 PDF 生成与下载

- **目标**：让“下载PDF”在有正式PDF时直接得到文件；无法直下时使用诚实文案，解决打印窗口误导。
- **涉及文件/模块**：新增 `scripts/export-pdf.mjs`、`references/export-contract.md`、`tests/pdf-export.smoke.mjs`；重构 `scripts/export-pdf.sh`、`scripts/render-deck.mjs`、`assets/runtime/mint-runtime.js`、`package.json`。
- **具体改动**：
  - 使用项目级 Playwright/System Chrome 预生成 `report.pdf`，固定16:9、print background和page size。
  - 生成 `export-manifest.json`，记录HTML/PDF hash、版本、页数、生成时间。
  - HTML只有在同版本PDF存在时显示“下载PDF”，点击相对链接或Blob直接下载。
  - HTML被在线编辑后：若本地export bridge可用，显示“重新生成并下载当前版本”；否则显示“打印/导出当前版本PDF”，并提供清楚步骤。
  - 删除“导出PDF”按钮实际仅调用 `window.print()` 的误导路径。
- **输入与输出**：输入为通过QA的 `report.html`、deck version/hash；输出 `report.pdf`、`export-manifest.json` 和匹配实际能力的UI状态。
- **依赖关系**：P0-04。
- **测试方式**：CLI导出、文件存在与magic bytes检查、页数检查、hash匹配、浏览器点击下载、编辑后状态测试、无浏览器依赖降级测试。
- **验收标准**：正式输出点击一次即可获得`.pdf`；PDF页数等于HTML页数；不存在匹配PDF时按钮不得叫“下载PDF”；用户无需猜测打印窗口操作。
- **回归测试案例**：周报五页、单页Vodafone、包含图表互动的HTML、编辑文字后的HTML。
- **风险与回滚方案**：保留明确命名的“打印/导出PDF”降级入口；Playwright浏览器和缓存写入项目 `.cache/playwright`，避免内部盘膨胀；导出失败不删除HTML。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。`pdf-export.smoke.mjs` 在授权的系统Chrome中退出码0：4页HTML生成4页、2.6MB的真实PDF；magic bytes、pdfinfo页数、HTML/PDF哈希与manifest通过；正式版产生直接PDF下载意图1次；在线编辑后降级为“打印 / 导出当前编辑版”1次；缺依赖回滚1次且HTML保留。用Poppler将4页PDF全部渲染为PNG并人工检查，未见裁切、重叠或字体异常。旧 `export-pdf.sh` 入口保留并委托新导出器，未删除兼容路径。其余P0专项及`npm test`全部通过。

### P0-09 周报与知识库垂直回归

- **目标**：用本轮真实失败材料证明“语义分析→页面合同→版式选择→PDF导出”闭环有效，而非只通过合成测试。
- **涉及文件/模块**：新增 `tests/fixtures/weekly-kb-source.md`、`weekly-kb-expected.json`、`tests/weekly-kb.e2e.mjs`；产物写入 `outputs/v06-weekly-kb-e2e/`。
- **具体改动**：固化匿名化原始文本、预期关系、五页页面角色、Pattern和连接器合同；运行完整P0流水线。
- **输入与输出**：输入为用户提供的周报/知识库文本；输出 content map、semantic graph、deck plan、layout selection、HTML、PDF和QA。
- **依赖关系**：P0-07、P0-08。
- **测试方式**：执行E2E；浏览器逐页截图1920×1080和1280×720；人工只核验既定合同，不临时改标准。
- **验收标准**：
  - P1三项并列升级，无箭头，突出140页。
  - P2变化识别→证据保留→产品检查，方向明确。
  - P3使用V1/V2对比，突出83份和36,868区块。
  - P4突出261.53和58%，形成成本问题→原因→三级方案。
  - P5小额熔断测试与MCP包装构成清楚的下一步，MCP能力为并列分支。
  - 五页无空页，PDF直接下载。
- **回归测试案例**：即本轮完整真实材料。
- **风险与回滚方案**：新产物目录不覆盖V0.5报告；任何页面未达预期则阻止进入P1。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。`node tests/weekly-kb.e2e.mjs` 退出码0：真实材料固定为5页，依次选择 `parallel-columns`、`horizontal-sequence`、`before-after`、`risk-decision`、`timeline` 五种Pattern；连接器数量依次为0/3/1/2/2，并列升级无箭头。15个primary atom与5个数字全部覆盖，QA状态为`formal-ready`且无warning。系统Chrome生成5页真实PDF（827,069 bytes），HTML写入匹配PDF元数据并显示直接下载；`pdfinfo`确认1152×648pt、5页。视觉QA在1920×1080、1280×720、390×844三个视口生成15张截图，自动错误0；HTML截图及Poppler渲染的5页PDF经人工逐页检查，无裁切、重叠、标题超过两行或字体异常。P0-01至P0-08专项与`npm test`全部再次通过。当前仍可观察到两栏页面有效区域偏窄和部分页面假留白，这正是P1-01/P1-04的既定改造范围，不以视觉美化掩盖。

### P1-01 约束式页面布局模型

- **目标**：用可解释的区域、网格和容量约束替代随机绝对定位，建立清楚的信息流。
- **涉及文件/模块**：新增 `schemas/layout-plan.schema.json`、`scripts/build-layout-plan.mjs`、`references/layout-constraints.md`、`tests/layout-plan.mjs`；修改 `assets/layout-patterns.json`。
- **具体改动**：为每页生成画布、安全边距、title/primary/support/source zones、网格跨度、阅读序号、最小/最大面积、主视觉占比和对齐约束。
- **输入与输出**：输入为 page contract、Pattern、内容测量估算；输出 `layout-plan.json`。
- **依赖关系**：P0-05、P0-06。
- **测试方式**：Schema测试；不同内容量下区域不重叠、主视觉占55%–70%、阅读坐标单调。
- **验收标准**：不存在随机散落四角；所有元素属于明确zone；页面有唯一阅读起点；主视觉空间优先于装饰和脚注。
- **回归测试案例**：三栏并列、五步流程、V1/V2对比、单一风险、图表+解读。
- **风险与回滚方案**：先只为新Pattern启用；旧renderer保留；约束无解时返回`layout-blocked`而非自由摆放。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。新增V0.6 Layout Plan Schema、四类布局模板与22种Pattern映射、确定性布局构建器和布局约束文档。`node tests/layout-plan.mjs` 退出码0：覆盖三栏并列、五步流程、V1/V2、单一风险、图表+解读5类页面，共22个zone；5条阅读路径空间坐标单调；主视觉权重固定为64%；重叠负例与缺失模板负例各1个均被阻断；相同输入两次结果完全一致。真实周报/知识库5页已生成 `outputs/v06-weekly-kb-e2e/layout-plan.json`，共21个受控zone。Pattern Registry、Layout Selection、Semantic QA和`npm test`全部再次通过。布局模型尚未接管HTML，这是P1-02的明确范围。

### P1-02 HTML Renderer 按 Pattern 解耦

- **目标**：拆分当前单体 `render-deck.mjs`，让每个Pattern拥有清晰、可测试的渲染器，避免所有页面共享同一骨架。
- **涉及文件/模块**：新增 `scripts/renderers/html/*.mjs`、`scripts/renderers/shared.mjs`、`tests/html-pattern-renderers.mjs`；重构 `scripts/render-deck.mjs`、`assets/runtime/mint-components.css`、`tests/weekly-kb.e2e.mjs`。
- **具体改动**：按Pattern key分派；Renderer只能消费layout plan，不得自行决定语义、添加箭头或发明内容；输出DOM携带 `data-zone-id`、`data-reading-order`、`data-relation-ref`。
- **输入与输出**：输入 deck spec、layout plan、assets；输出 standalone HTML。
- **依赖关系**：P1-01。
- **测试方式**：每个Pattern DOM snapshot、可见claim覆盖、无未知字段、无空primary zone；现有互动功能smoke。
- **验收标准**：渲染层不再重新做路由；不同Pattern产生不同语义DOM；所有连接器可追溯；HTML编辑、导航、媒体和图表互动不退化。
- **回归测试案例**：周报五页、股权数字页、Vodafone架构页、媒体页。
- **风险与回滚方案**：建立legacy renderer adapter；逐Pattern迁移，未迁移Pattern仍由旧renderer处理但不能进入V0.6正式验收。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。新增共享转义/zone/连接器工具和22种Pattern注册渲染器；V0.6只接受已通过的`layout-plan.json`，缺失时阻断，旧Schema继续使用legacy adapter。`node tests/html-pattern-renderers.mjs`退出码0：22种Pattern全部形成独立`data-pattern-structure`，22页均包含title/primary/source zone与阅读序号，14个连接器全部携带`data-relation-ref`，15类非方向性Pattern没有连接器，未知字段未进入渲染DOM，缺Layout Plan负例1个被阻断；编辑、下载、全屏、导航、图表、媒体合同均保留。真实周报/知识库五页回归通过，Pattern依次为并列、横向流程、前后对比、风险决策、时间线，箭头数0/3/1/2/2。系统Chrome生成15张三视口截图，自动错误0，人工检查无裁切和Pattern错配；浏览器实测键盘切页、编辑模式（24个可编辑节点）与下载菜单均正常。Layout Plan、Pattern Registry、Semantic QA及既有Smoke全部通过。当前仍存在部分页面内容偏稀和视觉重心可进一步收紧，交由P1-03/P1-04处理。

### P1-03 阅读顺序、重心与碎片化 QA

- **目标**：自动发现阅读路线不清、视觉重心偏移、内容过度分散和卡片碎片化。
- **涉及文件/模块**：新增 `scripts/qa-reading-order.mjs`、`scripts/qa-layout-geometry.mjs`、`tests/layout-geometry.mjs`；重构 `scripts/build-layout-plan.mjs`、`scripts/visual-qa.mjs`、`scripts/validate-rendered-html.mjs`。
- **具体改动**：浏览器读取DOM bounding boxes；校验reading order与几何顺序一致；计算内容联合区域、视觉重心、区域间最大断裂、独立小块数量和卡片化比例。
- **输入与输出**：输入渲染HTML和layout plan；输出几何QA指标、截图标注和失败原因。
- **依赖关系**：P1-01、P1-02。
- **测试方式**：人为制造四角散落、逆序、两个焦点、过多小卡片；正例测试L→R、T→B、center-out。
- **验收标准**：每页阅读顺序可推导且与合同一致；无随机四角散落；五段完整论述不会被拆成五个无意义悬浮卡片。
- **回归测试案例**：当前周报旧版应失败；新版五页应全部通过。
- **风险与回滚方案**：指标按Pattern设阈值，避免用一个全局阈值误伤；初期同时输出测量值和截图，校准后才升为hard fail。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。新增reading-order与layout-geometry两层QA：前者核对DOM zone顺序和Layout Plan一致，后者测量视觉重心、四角散落、阅读跨距、独立小卡片及竞争焦点；视觉QA现在输出普通截图和带1→2→3区块标注的截图。`node tests/layout-geometry.mjs`退出码0：L→R、T→B、center-out三类正例通过；逆序、四角散落、五段论述碎片化和双焦点四类负例全部阻断。真实五页在1920×1080、1280×720、390×844共15次几何检查全部通过，生成30张普通/标注截图；每页阅读路径固定为title→page-answer→primary→可选support→source。QA同时发现并修复无support页原序号1→2→3→5的断号。`validate-rendered-html`现可检查Pattern漂移、zone缺失、阅读序号重复/断裂及可见atom覆盖，真实五页零错误。既有known-bad周报语义错配继续被阻断，Pattern/布局/Smoke回归全部通过。

### P1-04 密度、有效留白与容量 QA

- **目标**：区分设计留白和“内容未组织导致的假留白”，保证紧凑、清晰、有呼吸感。
- **涉及文件/模块**：新增 `scripts/qa-density.mjs`、`tests/fixtures/density-cases.json`、`tests/density.mjs`；修改 `scripts/visual-qa.mjs`、`references/layout-constraints.md`、`assets/runtime/mint-components.css`。
- **具体改动**：测量有效内容面积、主视觉占比、最大空矩形、边距、低价值装饰面积、文字密度和最小字号；阈值按Pattern和densityProfile定义。
- **输入与输出**：输入浏览器几何信息、layout plan、density profile；输出密度QA和修复建议。
- **依赖关系**：P1-01、P1-02。
- **测试方式**：过空、过密、主视觉受挤压、装饰占比过高四类负例；标准版式正例。
- **验收标准**：主视觉占可用正文55%–70%；无大面积无意义空区；不通过缩小中文字体掩盖容量问题；装饰不挤压信息。
- **回归测试案例**：知识库V1/V2页、三级复核页、七项MCP能力页、单一结论页。
- **风险与回滚方案**：阈值由fixture校准并版本化；误报时调整Pattern profile，不删除密度QA。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。新增按Pattern分级的密度QA，测量primary区有效内容包络、最大空矩形、最小字号、文字面积、装饰面积和主视觉权重；并将并列、流程、前后对比及support模块改为受控垂直重心，消除“文字堆顶部、下方整片空白”。`node tests/density.mjs`退出码0：标准并列、单一结论、七项MCP能力3类正例通过；假留白、过密、10px小字、装饰挤压4类负例全部阻断。真实五页三视口共15次密度检查全部通过：主视觉权重64%，有效内容包络约19%–60%，最大空区约33%–36%，主视觉最小字号15px，装饰占比0；此前13px标签被QA阻断后已提高。知识库V1/V2、三级复核、下一步时间线及单一结论/七能力回归均覆盖，所有语义、几何、Renderer及Smoke测试再次通过。

### P1-05 中文 CJK 排版与溢出 QA

- **目标**：解决中文标题拥挤、错误换行、标点避头尾、数字单位拆分、中英文混排和字体回退。
- **涉及文件/模块**：新增 `skills/mint-report-deck/references/cjk-typography-contract.md`、`skills/mint-report-deck/scripts/cjk-text-fit.mjs`、`skills/mint-report-deck/scripts/qa-cjk-render.mjs`、`skills/mint-report-deck/tests/fixtures/cjk-cases.json`、`skills/mint-report-deck/tests/cjk-typography.mjs`；重构 `skills/mint-report-deck/references/text-layout-contract.md`、`skills/mint-report-deck/scripts/build-page-contracts.mjs`、`skills/mint-report-deck/scripts/validate-page-contracts.mjs`、`skills/mint-report-deck/scripts/validate-deck.mjs`、`skills/mint-report-deck/scripts/visual-qa.mjs`、`skills/mint-report-deck/scripts/renderers/shared.mjs`、`skills/mint-report-deck/scripts/renderers/html/registry.mjs`、`skills/mint-report-deck/assets/runtime/mint-runtime.css`、`skills/mint-report-deck/assets/runtime/mint-components.css`。
- **具体改动**：
  - 标题最多2行；先语义断行、缩短和换版式，最后才在最低字号范围内缩放。
  - 实现中文行首/行尾禁则、全角标点检查。
  - 金额、百分比、数字+单位、英文缩写不在错误位置拆分。
  - 建立macOS/Windows通用字体fallback并检测实际字体。
  - 静态估算与真实浏览器测量双重检查。
- **输入与输出**：输入文本块、zone尺寸、字体profile；输出拟合结果、断行建议、实际渲染QA。
- **依赖关系**：P1-01、P1-02。
- **测试方式**：长中文标题、中英文混排、`36,868个`、`261.53`、`58%`、`DeepSeek V4 Pro`、人民币/美元金额、括号引号标点等fixture；多viewport截图。
- **验收标准**：标题不超过2行；明显标点避头尾错误为0；正文不低于设定最小字号；macOS和Windows fallback可用；无文字溢出。
- **回归测试案例**：老板失败标题、周报/知识库全部页面、股权数字页。
- **风险与回滚方案**：不直接复制AGPL代码；可引入MIT CJK估算逻辑时保留许可证；字体不可用时使用受控fallback并报告，不静默换成异常字体。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。新增静态 CJK 拟合、中文禁则、数字/单位/英文语义单元保护和渲染 QA；老板失败长标题被判定为 `rewrite-required`，5个标题正反例、5类保护单元与2个渲染正反例全部通过。股权数字页与三章节标题合同通过。周报/知识库真实5页在1920×1080、1280×720、390×844完成15次浏览器测量和截图：标题均为1行（上限2行）、正文最小15px、文字溢出0、保护单元跨行0、受控中文字体可解析；产物为 `outputs/v06-weekly-kb-e2e/visual-qa-v06-cjk-3.json` 与同名截图目录。`layout-geometry.mjs`、`density.mjs`、`semantic-layout-qa.mjs`、22种Pattern renderer、页面合同、CJK专项和`npm test`全部退出码0；未降低任何既定阈值。

### P1-06 自动修复与阻断编排

- **目标**：QA失败后按确定顺序重组页面，最多两轮；无法安全修复时阻断，不交付错误页面。
- **涉及文件/模块**：重构 `skills/mint-report-deck/scripts/repair-deck.mjs`、`skills/mint-report-deck/scripts/qa-deck.mjs`；新增 `skills/mint-report-deck/scripts/repair-layout.mjs`、`skills/mint-report-deck/references/repair-policy.md`、`skills/mint-report-deck/tests/fixtures/repair-cases.json`、`skills/mint-report-deck/tests/repair-orchestration.mjs`。
- **具体改动**：修复顺序固定为：去重/缩短支持文字→语义断行→重新分组zone→切换兼容Pattern变体→在页数合同允许时拆页→最后有限缩放；不得改变事实、关系和连接器语义。
- **输入与输出**：输入全部QA报告和结构化源；输出修复后的contracts/layout plans或blocked report。
- **依赖关系**：P0-07、P1-03、P1-04、P1-05。
- **测试方式**：为每种QA错误构造可修复与不可修复样例；验证两轮上限和exact-one-page禁止拆页。
- **验收标准**：修复不新增事实、不丢primary atom、不改变关系类型；两轮后仍失败则正式状态为blocked；禁止无限循环。
- **回归测试案例**：超长标题、假留白、过密一页、错误Pattern、并列箭头、强制一页。
- **风险与回滚方案**：每轮保存结构diff和QA；失败恢复到修复前结构文件，不覆盖用户输入。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。新增保守型 `repair-layout.mjs` 与固定六步修复政策；5类可修复场景（去重+两行语义断行、空支持区重组、兼容Pattern重选、获批完整拆页、有限缩放）通过，3类不可修复场景（exact-one-page拆页、并列箭头/语义错误、两轮后仍失败）被阻断。每轮保存QA输入、结构hash diff、动作与阻断原因；最多2轮。V0.6 `qa-deck → repair-deck` CLI 保持Schema 0.6并强制后续重渲染、visual-qa和结构QA，不再降级V0.4或假报正式完成。事实、实体、数字、关系类型和primary atom不变式均保持。真实5页材料QA为formal-ready；`semantic-layout-qa.mjs`、`cjk-typography.mjs`、P1-06专项及`npm test`全部退出码0。

### P1-07 整份材料版式节奏与章节一致性

- **目标**：让连续10页有合理变化，同时保证三大章节的引言和设计系统一致，不因追求多样而杂乱。
- **涉及文件/模块**：新增 `skills/mint-report-deck/scripts/qa-deck-rhythm.mjs`、`skills/mint-report-deck/references/deck-rhythm-contract.md`、`skills/mint-report-deck/tests/fixtures/ten-page-deck.json`、`skills/mint-report-deck/tests/deck-rhythm.mjs`；修改 `skills/mint-report-deck/scripts/select-layout.mjs`、`skills/mint-report-deck/scripts/qa-deck.mjs`、`skills/mint-report-deck/references/deck-planning.md`。
- **具体改动**：同一Pattern不得连续超过2页；10页材料原则上至少4个Pattern family；章节引言共享统一family、边距和字号；多样性仅作为兼容候选的次级评分。
- **输入与输出**：输入全deck页面合同与Pattern序列；输出节奏QA和必要的同义Pattern替换建议。
- **依赖关系**：P0-06、P1-03、P1-04。
- **测试方式**：10页重复Pattern负例、三章节引言不一致负例、语义只能使用同类版式的例外测试。
- **验收标准**：10页无机械重复；每页版式选择有语义解释；三章节引言一致；不得为了达成数量指标选错关系版式。
- **回归测试案例**：三章节整份汇报、10页混合项目进展/数据/风险/行动材料。
- **风险与回滚方案**：节奏QA不得覆盖硬语义兼容性；没有合适变体时允许记录有依据的例外，而不是强制换错版式。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。新增整份材料Rhythm QA与7个Pattern family；10页混合材料选择7个family、最大连续重复1。10页机械重复、连续第3页无例外、三章节引言family/Pattern/阅读结构漂移均被阻断；确实只有同类语义可用时，带候选淘汰依据的`rhythmException`可通过。选择器只在已通过关系、容量、证据、阅读轴和连接器硬约束的候选中避免连续第三次重复，不改变真实语义。真实5页材料使用3个family、最大重复1并保持formal-ready；15类路由45次确定性运行、语义/阅读/几何/CJK/修复与`npm test`全部退出码0。

### P1-08 可编辑 PPTX 确定性输出

- **目标**：为受控Mint Pattern生成文字、Shape、图片和图表均可编辑的PPTX，避免整页截图。
- **涉及文件/模块**：修改 `package.json`；新增 `skills/mint-report-deck/scripts/render-pptx.mjs`、`skills/mint-report-deck/scripts/renderers/pptx/*.mjs`、`skills/mint-report-deck/scripts/qa-pptx-editability.mjs`、`skills/mint-report-deck/tests/pptx.smoke.mjs`；更新 `skills/mint-report-deck/references/presentations-integration.md`。继续使用现有 `skills/mint-report-deck/assets/presentation/Mint_Report_Component_Library.pptx` 与 Presentations 运行时，不引入第二套PPT引擎。
- **具体改动**：遵循Codex Presentations规范，使用固定工作区版本的 `@oai/artifact-tool`；共用page/layout contracts；从Mint组件源页继承/复制可编辑对象和版式；文本、简单Shape、图片和Chart使用原生对象；Presentations适配器必须消费同一合同。不得使用整页截图、python-pptx或另一套PPT引擎。
- **输入与输出**：输入 deck spec、layout plan、Mint assets；输出 `report.pptx` 和PPTX QA。
- **依赖关系**：P0-04、P0-05、P1-01、P1-05。
- **测试方式**：解包PPTX检查文字对象、Shape、chart parts和图片；LibreOffice/PowerPoint渲染逐页截图；检查中文溢出、对象可编辑性和页数。
- **验收标准**：正文和标题100%为可编辑文本；简单图形为可编辑Shape；数据图表优先为原生可编辑Chart；不得以整页图片冒充PPTX；中文无溢出。
- **回归测试案例**：周报五页、股权数字页、Vodafone三层架构、折线图互动对应页。
- **风险与回滚方案**：Artifact Tool使用Codex工作区固定运行时，不写入全局依赖；失败时继续交付HTML/PDF并明确PPTX未生成，不调用PptxGenJS、python-pptx或低质量截图替代。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。新增基于固定 `@oai/artifact-tool` 运行时的确定性 PPTX 适配器；每页先映射并复制现有 Mint 组件源页，再只修改继承的命名对象，未使用空白页、PptxGenJS、python-pptx 或整页截图。8 页回归材料覆盖周报5页、股权数字页、Vodafone三段能力链和双系列折线图；导出包包含175个可编辑文字对象、233个可编辑Shape、2个原生Chart XML及对应Office chart relationship，图片对象为0，未残留母版示例文案。固定运行时与LibreOffice/PowerPoint兼容渲染均完成，`slides_test.py`全页无越界；中文标题最多2行，修复了母版标题占位符残字和宋体缺字回退，统一使用PingFang SC编辑文本。`tests/pptx.smoke.mjs`、完整`npm test`（22类路由、32条提示词、66次确定性运行、8份HTML渲染）均退出码0。视觉证据：`.work/p108-pptx-smoke/final-render-4/`；结构证据：`.work/p108-pptx-smoke/qa-pptx.json`。

### P1-09 HTML / PDF / PPTX 跨输出一致性

- **目标**：保证三种输出的事实、数字、关系、页数和阅读顺序一致，同时允许原生布局细节不同。
- **涉及文件/模块**：新增 `scripts/validate-cross-output.mjs`、`scripts/extract-pptx-content.py`、`tests/cross-output.e2e.mjs`；修改 `scripts/qa-deck.mjs`、`scripts/renderers/pptx/edit-slide.mjs`。PPTX备注只新增机器可读的主关系和atomRefs追踪标记，不改变页面视觉与母版选择。
- **具体改动**：从HTML metadata、PDF页文本、PPTX XML提取atomRefs、数字和标题；对比schema/version/hash、页数、结论、数字和关系标记。
- **输入与输出**：输入 report.html/report.pdf/report.pptx及结构源；输出跨输出一致性报告。
- **依赖关系**：P0-08、P1-08。
- **测试方式**：正常一致正例；故意修改一个数字、删除一页、变更实体名称的负例。
- **验收标准**：正式事实、关键数字、页面结论、页数差异为0；新增实体/数字/判断为0；不一致时阻断正式交付。
- **回归测试案例**：股权公式、周报数字、Vodafone实体名称、强制一页材料。
- **风险与回滚方案**：检查器只读输出；发生解析失败时标记未验证，不得声称一致。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。`node skills/mint-report-deck/tests/cross-output.e2e.mjs` 完成2个真实正例与4个破坏性负例：关键数字单页和Vodafone单页的HTML/PDF/PPTX页数均为1且跨端结论、标题、关键数字、标题级实体、主关系和atomRefs一致；改写261.53、期望页数增加但输出少一页、Vodafone替换为Vodacom、损坏PPTX均被阻断，其中解析失败状态严格为`unverified`。PDF必须携带与当前HTML内嵌deck-spec一致的content hash，不能从静态文本反推的图形关系由该派生链路证明。`qa-deck.mjs --cross-output-dir`在任一输出缺失时返回`blocked`，不得以warning继续交付。PPTX备注新增页面问题、页面结论、主关系、atomRefs和来源引用；数字页未占用的受控卡位用于承接风险/决策辅助模块，避免跨端丢失关键信息。`node --check`、Python `py_compile`、PPTX编辑性回归（8页、181个文本run、243个可编辑shape、2个原生图表）及`npm test`全部通过。

### P1-10 30+ 语义回归与 10 页盲测

- **目标**：证明系统不是只针对当前案例打补丁，并验证连续页面多样性、中文排版、导出和稳定性。
- **涉及文件/模块**：扩展 `tests/fixtures/prompt-regression.json`、`routing-cases.json`；新增 `tests/fixtures/semantic-adversarial.json`、`tests/v06-regression.mjs`；修改 `package.json` test scripts。
- **具体改动**：覆盖并列/递进最小句对、流程、时间、因果、对比、层级、组成、公式、阈值、风险、媒体、三章节、强制一页、缺单位/来源、长标题和无图表数据等不少于30组用例。
- **输入与输出**：输入回归语料；输出完整测试报告、截图索引和失败清单。
- **依赖关系**：P1-06、P1-07、P1-09。
- **测试方式**：同一输入连续运行3次；10页deck全流程；全新Codex任务盲测应在另行获得允许后执行。
- **验收标准**：
  - 关系误用连接器为0。
  - primary信息覆盖100%。
  - 标题最多2行，中文溢出为0。
  - 10页至少4个Pattern family且同Pattern不连续超过2页，合理例外有记录。
  - HTML/PDF/PPTX事实和数字差异为0。
  - 三次运行的页面命题和主要Pattern稳定。
- **回归测试案例**：全部既有fixtures、本轮周报/知识库、Vodafone、巴基斯坦、股权、三章节完整汇报。
- **风险与回滚方案**：盲测不接触生产数据、不覆盖正式输出；任何P0/P1回归失败则禁止进入视觉优化和发布。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。新增30组语义对抗边界并复用32组真实提示词；中文关系、Layout选择、10页节奏、CJK排版和密度专项全部通过。`npm run test:v06`生成10页受控盲测材料，覆盖6个页面family，同类型最多连续2页；HTML、PDF、PPTX均为10页，跨格式状态`formal-ready`。`npm test`同步通过22个路由、32个提示词和全部既有严格阻断案例。未改写任何用户已有汇报材料。

### P2-01 Mint 视觉细节统一

- **目标**：在内容、布局、中文和导出全部合格后统一配色、线条、阴影、圆角、动效和交互反馈，不改变语义结构。
- **涉及文件/模块**：`assets/runtime/mint-runtime.css`、`mint-components.css`、媒体资产和PPTX masters。
- **具体改动**：统一Mint design tokens；降低装饰噪音；交互不遮挡内容；过渡动画遵守演示节奏和减少动态设置。
- **输入与输出**：输入通过P1验收的HTML/PPTX；输出视觉统一版本。
- **依赖关系**：P1-10。
- **测试方式**：多viewport截图、深浅页面对比、投屏可读性、打印/PDF对比。
- **验收标准**：视觉改动不改变reading order、内容面积、字号下限和连接器语义；交互控件不挡住正文。
- **回归测试案例**：10页盲测deck、周报五页、单页数字和媒体页。
- **风险与回滚方案**：设计token独立提交；任何QA退化则撤回视觉补丁，不修改结构源。
- **完成状态**：`DONE`
- **测试结果**：`PASS`（2026-08-18）。按用户要求不重新制作旧材料，本项冻结既有Mint Formal视觉并只验证其不破坏V0.6结构合同。10页盲测保持6个页面family、同类型不连续超过2页，标题两行约束、CJK排版、密度、阅读顺序和跨格式检查均通过；未新增装饰性CSS或改变既有正式输出。

### P2-02 Skill 文档、安装包与发布验收

- **目标**：把V0.6规则、脚本和依赖正确纳入Skill，并确保macOS/Windows安装与使用路径清楚。
- **涉及文件/模块**：`SKILL.md`、`agents/openai.yaml`、`references/*.md`、`.codex-plugin/plugin.json`、安装脚本/分发包、`package.json`、`THIRD_PARTY_NOTICES.md`。
- **具体改动**：更新默认工作流和版本；说明PDF/PPTX能力检测及降级；登记MIT依赖；生成分发包；保持详细合同按需加载，不膨胀SKILL.md。
- **输入与输出**：输入全部通过验收的V0.6模块；输出本地Skill、GitHub发布候选和安装验证报告。
- **依赖关系**：P2-01。
- **测试方式**：运行skill quick validation、全量npm test、macOS新任务安装测试、Windows路径/权限静态检查及可用环境测试。
- **验收标准**：安装后粗略中文笔记可生成合格HTML/PDF；PPTX依赖可用时生成可编辑文件；依赖不可用时提示真实能力；所有测试通过后才允许发布。
- **回归测试案例**：新用户“把GitHub链接发给Agent并让它安装”、周报五页、单页合作架构、含图表材料。
- **风险与回滚方案**：先发布候选版本，不覆盖上一稳定tag；失败可恢复上一Skill版本和安装链接；不得删除历史可用包。
- **完成状态**：`IN PROGRESS`
- **测试结果**：待执行。

## 3. 需求覆盖矩阵

| 需求 | 对应 Action Item |
|---|---|
| 先理解关系再选页面 | P0-01, P0-02, P0-04, P0-06 |
| 并列不得错误使用箭头 | P0-02, P0-03, P0-07 |
| 流程/递进/时间必须有明确方向 | P0-02, P0-03, P0-05 |
| 建立20类左右的信息表达能力 | P0-05 |
| 不同页面不能机械重复 | P0-06, P1-07, P1-10 |
| 三大章节引言风格一致 | P0-04, P1-07 |
| 每页明确第一、第二、第三阅读位置 | P0-04, P1-01, P1-03 |
| 不允许内容随机散落四角 | P1-01, P1-03 |
| 减少碎片化卡片/Dashboard感 | P0-05, P1-03 |
| 提高有效信息密度、减少假留白 | P1-01, P1-04 |
| 主视觉优先、信息层级清楚 | P0-04, P1-01, P1-04 |
| 页面级Layout/Logic/Reading/Density QA | P0-07, P1-03, P1-04 |
| QA失败自动重新布局或阻断 | P1-06 |
| 标题最多2行 | P1-05, P1-06, P1-10 |
| 中文字体、换行、标点、混排、溢出 | P1-05 |
| 真正一键下载PDF | P0-08 |
| 无法直下时UI文案与行为一致 | P0-08 |
| HTML编辑后PDF版本一致 | P0-08, P1-09 |
| PPTX文字/Shape/图表可编辑 | P1-08 |
| HTML/PDF/PPTX事实数字一致 | P1-09 |
| 10页至少具备合理版式变化 | P1-07, P1-10 |
| 所有页面生成后自动QA | P0-07, P1-03, P1-04, P1-05, P1-06 |
| 最后才处理视觉风格 | P2-01 |
| GitHub机制与许可证边界 | P1-05, P1-08, P2-02 |
| 每项修改后立即测试并更新状态 | 本文件“执行纪律” |

## 4. 阶段闸门

- **P0 Gate**：P0-01至P0-09全部`DONE`，周报/知识库垂直回归通过，PDF行为符合按钮承诺，方可开始P1。
- **P1 Gate**：P1-01至P1-10全部`DONE`，30+回归与10页盲测通过，方可开始视觉优化。
- **P2 Gate**：视觉改动不得导致任何P0/P1测试退化；Skill验证、安装验证和发布候选验证通过后才可部署。
