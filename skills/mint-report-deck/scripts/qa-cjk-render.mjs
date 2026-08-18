import { validateCjkLines } from "./cjk-text-fit.mjs";

export const REQUIRED_FONT_FALLBACKS = ["Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei"];

export function validateCjkRender(measurement, { minimumBodyFont = 15 } = {}) {
  const errors = [];
  const titleLines = measurement.titleRenderedLines || [];
  const titleValidation = validateCjkLines(titleLines);
  if (!titleValidation.passed) errors.push(...titleValidation.errors.map((error) => `标题渲染：${error}`));
  if (measurement.textOverflow?.length) errors.push(`文字溢出：${measurement.textOverflow.join(", ")}`);
  if (Number.isFinite(measurement.minimumBodyFont) && measurement.minimumBodyFont < minimumBodyFont) errors.push(`正文最小字号${measurement.minimumBodyFont}px低于${minimumBodyFont}px`);
  const declaredFonts = String(measurement.declaredFontFamily || "");
  if (!REQUIRED_FONT_FALLBACKS.some((font) => declaredFonts.includes(font))) errors.push("字体栈缺少受控中文fallback");
  if (Array.isArray(measurement.availableCjkFonts) && !measurement.availableCjkFonts.length) errors.push("运行环境没有可用的受控中文字体");
  if (!measurement.resolvedCjkFont) errors.push("无法确认实际采用的中文字体");
  for (const token of measurement.splitProtectedTokens || []) errors.push(`数字或英文语义单元被拆行：${token}`);
  return { passed: errors.length === 0, errors, metrics: { titleLines: titleLines.length, minimumBodyFont: measurement.minimumBodyFont ?? null, availableCjkFonts: measurement.availableCjkFonts || [], resolvedCjkFont: measurement.resolvedCjkFont || null } };
}
