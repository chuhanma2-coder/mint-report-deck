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
  if (page.numbersAreOrdinal || page.numbersAreDecorative) {
    return r === "sequence" && page.hasRealOrder
      ? result("process", "编号对应真实的先后动作")
      : result("statement", "编号只是组织符号，不能触发流程或图表");
  }
  const quantitative = new Set(["trend", "quantity", "part-to-whole", "numeric-matrix"]);
  if (quantitative.has(r) && !evidenceContract(n)) return result("needs-review", "数值图表缺少标签、数值、单位、期间、统计对象或来源", "blocked");
  if (r === "trend") return n.orderedTime ? result("chart:line", "连续时间轴用于观察趋势") : result("needs-review", "折线图需要自然有序的时间轴", "blocked");
  if (r === "quantity") return result("chart:bar", n.longLabels ? "长标签优先横向条形图" : "少量类别按共同零基线比较");
  if (r === "part-to-whole") {
    if (n.values.some((v) => Number(v) < 0)) return result("needs-review", "构成数据不能含负数", "blocked");
    return n.values.length >= 2 && n.values.length <= 5 ? result("chart:donut", "单一完整整体且仅 2-5 个部分") : result("chart:stacked-bar", "部分较多，使用共同基线更易读");
  }
  if (r === "numeric-matrix") return result("heatmap", "两个分类维度共享同一数值尺度");
  const routes = {
    "front-middle-back": ["architecture-brief", "前台—中台—后台是分层业务架构"],
    hierarchy: ["architecture-brief", "父子或层级关系"],
    sequence: page.hasRealOrder ? ["process", "输入—处理—输出或真实阶段顺序"] : ["statement", "不存在可证实的先后关系"],
    time: ["timeline", "单轨时间或阶段演进"],
    parallel: ["dual-track-roadmap", "两条并行演进路径"],
    roles: ["swimlane", "角色及职责分工"],
    comparison: ["comparison", "两个或多个方案的同维度差异"],
    matrix: ["matrix", "两个分类维度的交叉关系"],
    "exact-values": ["table", "需要读取精确文字或数值"],
    action: ["decision", "决策、动作、Owner 与时间应突出"],
    cause: ["process", "受支持的因果链按阅读顺序表达"],
    media: ["media", "图像或视频是主要证据"],
    opening: ["cover", "完整多页材料的封面"],
    "one-conclusion": ["statement", "单一核心结论"]
  };
  const [component, reason] = routes[r] || routes["one-conclusion"];
  return result(component, reason);
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(JSON.stringify(selectComponent(JSON.parse(process.argv[2])), null, 2));
