const has = (v) => v !== undefined && v !== null && v !== "";
const result = (component, reason, confidence = "high") => ({ component, reason, confidence });
const evidenceContract = (n) => Boolean(
  Array.isArray(n?.labels) && n.labels.length &&
  Array.isArray(n?.values) && n.values.length === n.labels.length &&
  has(n.unit) && has(n.period) && has(n.subject) &&
  Array.isArray(n.sourceRefs) && n.sourceRefs.length
);

export function selectComponent(page) {
  const r = page.relationship || "one-conclusion";
  const n = page.numericEvidence;
  const roles = new Set([...(page.numericRoles || []), ...((page.numericClaims || []).map((claim) => claim.role))]);
  if (roles.has("formula-result") || roles.has("input")) return result("quantitative-story:formula-band", "结论依赖明确公式和计算结果");
  if (roles.has("upper-bound") || roles.has("lower-bound")) return result("quantitative-story:threshold-bar", "实际值需要与上限或下限在同一尺度比较");
  if (roles.has("theoretical") && roles.has("direct") && roles.has("gap")) return result("quantitative-story:gap-bridge", "理论权益、直接承接和差额补偿构成完整决策关系");
  if (roles.has("actual") && roles.has("target")) return result("quantitative-story:actual-target", "实际值与目标值及差距应直接表达");
  if (roles.has("part") || roles.has("remainder")) return result("quantitative-story:allocation-bar", "已确认的构成关系需要共同基线");
  if (roles.has("forecast") || roles.has("range")) return result("quantitative-story:range-band", "预测或区间应展示不确定性边界");
  if (roles.has("scenario")) return result("quantitative-story:scenario-comparison", "多个互斥情景需要统一维度比较");
  if (roles.has("distribution") || roles.has("anomaly")) return result("quantitative-story:distribution", "需要展示分布或异常位置");
  if (page.numbersAreOrdinal || page.numbersAreDecorative) {
    return r === "sequence" && page.hasRealOrder
      ? result("process", "编号对应真实的先后动作")
      : result("statement", "编号只是组织符号，不能触发流程或图表");
  }
  const quantitative = new Set(["trend", "quantity", "part-to-whole", "numeric-matrix"]);
  if (quantitative.has(r) && !evidenceContract(n)) return result("needs-review", "数值图表缺少标签、数值、单位、期间、统计对象或来源", "blocked");
  if (r === "trend") return n.orderedTime ? result("chart:line", "连续时间轴用于观察趋势") : result("needs-review", "折线图需要自然有序的时间轴", "blocked");
  if (r === "quantity") return result("quantitative-story:ranked-comparison", n.longLabels ? "长标签优先横向比较" : "少量类别按共同零基线比较");
  if (r === "part-to-whole") {
    if (n.values.some((v) => Number(v) < 0)) return result("needs-review", "构成数据不能含负数", "blocked");
    return n.values.length >= 2 && n.values.length <= 5 ? result("chart:donut", "单一完整整体且仅 2-5 个部分") : result("chart:stacked-bar", "部分较多，使用共同基线更易读");
  }
  if (r === "numeric-matrix") return result("heatmap", "两个分类维度共享同一数值尺度");
  const routes = {
    "front-middle-back": ["capability-chain", "前台—中台—后台按能力与交接方向阅读"],
    "capability-handoff": ["capability-chain", "主体通过能力交接共同形成业务结果"],
    hierarchy: ["architecture-brief", "严格父子或层级归属关系"],
    sequence: page.hasRealOrder ? ["process", "输入—处理—输出或真实阶段顺序"] : ["statement", "不存在可证实的先后关系"],
    time: ["timeline", "单轨时间或阶段演进"],
    parallel: ["dual-track-roadmap", "两条并行演进路径"],
    roles: ["swimlane", "角色及职责分工"],
    comparison: ["comparison", "两个或多个方案的同维度差异"],
    matrix: ["matrix", "两个分类维度的交叉关系"],
    "exact-values": ["table", "需要读取精确文字或数值"],
    action: ["decision", "决策、动作、Owner 与时间应突出"],
    risk: ["risk-spotlight", "重要风险需要独立判断、影响和行动"],
    section: ["section-intro", "整份汇报的统一章节引言"],
    cause: ["process", "受支持的因果链按阅读顺序表达"],
    media: ["media", "图像或视频是主要证据"],
    opening: ["cover", "完整多页材料的封面"],
    "one-conclusion": ["statement", "单一核心结论"]
  };
  const [component, reason] = routes[r] || routes["one-conclusion"];
  return result(component, reason);
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(JSON.stringify(selectComponent(JSON.parse(process.argv[2])), null, 2));
