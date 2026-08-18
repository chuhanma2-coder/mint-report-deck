const OPENING = new Set(["（", "《", "【", "「", "『", "〈", "“", "‘", "(", "["]);
const CLOSING = new Set(["，", "。", "；", "：", "！", "？", "、", "）》", "》", "）", "】", "」", "』", "〉", "”", "’", ",", ".", ";", ":", "!", "?", ")", "]", "…"]);

export function cjkUnits(value) {
  return [...String(value || "").replace(/\s/g, "")].reduce((sum, char) => {
    if (/^[\x00-\xff]$/.test(char)) return sum + (/[A-Za-z0-9]/.test(char) ? 0.58 : 0.35);
    return sum + 1;
  }, 0);
}

// These tokens are semantic units in management material. Breaking inside them
// changes scanning speed and can separate a number from its business meaning.
export const protectedTokenPattern = /(?:[¥￥$]\s*)?\d[\d,]*(?:\.\d+)?\s*(?:%|％|个百分点|万亿元|亿元|万元|美元|人民币|元|个|份|页|个月|年|天|家|项)?|(?:DeepSeek\s+V\d+(?:\.\d+)?\s+Pro)|(?:[A-Za-z][A-Za-z0-9]*(?:[-\s/][A-Za-z0-9]+)+)|(?:[A-Z]{2,}(?:\d+)?)/g;

export function protectedTokens(value) {
  return [...String(value || "").matchAll(new RegExp(protectedTokenPattern.source, "g"))].map((match) => ({ text: match[0], start: match.index, end: match.index + match[0].length }));
}

function splitInsideProtected(index, tokens) {
  return tokens.some((token) => index > token.start && index < token.end);
}

export function validateCjkLines(lines, { maxLineUnits = 22, maxTotalUnits = 36 } = {}) {
  const errors = [];
  const clean = (Array.isArray(lines) ? lines : []).map((line) => String(line || "").trim()).filter(Boolean);
  if (!clean.length || clean.length > 2) errors.push("标题必须为1-2行");
  clean.forEach((line, index) => {
    if (cjkUnits(line) > maxLineUnits) errors.push(`第${index + 1}行超过${maxLineUnits}个中文字符宽`);
    if (CLOSING.has([...line][0])) errors.push(`第${index + 1}行以禁则标点开头：${[...line][0]}`);
    if (OPENING.has([...line].at(-1))) errors.push(`第${index + 1}行以禁则标点结尾：${[...line].at(-1)}`);
    if ([...line].length === 1) errors.push(`第${index + 1}行形成单字孤行`);
  });
  if (cjkUnits(clean.join("")) > maxTotalUnits) errors.push(`标题总宽超过${maxTotalUnits}个中文字符`);
  return { passed: errors.length === 0, errors, lines: clean };
}

function candidateBreaks(title) {
  const tokens = protectedTokens(title);
  const chars = [...title];
  const offsets = [];
  let offset = 0;
  chars.forEach((char, index) => {
    offset += char.length;
    if (offset <= 0 || offset >= title.length || splitInsideProtected(offset, tokens)) return;
    const left = title.slice(0, offset);
    const right = title.slice(offset);
    if (OPENING.has([...left].at(-1)) || CLOSING.has([...right][0])) return;
    const punctuation = /[，；：、,]/.test(char) ? 0 : 1;
    const balance = Math.abs(cjkUnits(left) - cjkUnits(right));
    const clause = /但|而|并|再|后|需|应|将|可/.test(right[0] || "") ? -0.25 : 0;
    offsets.push({ offset, score: punctuation * 12 + balance + clause, index });
  });
  return offsets.sort((a, b) => a.score - b.score || a.index - b.index);
}

export function suggestTitleLines(value, limits = {}) {
  const maxLineUnits = limits.maxLineUnits ?? 22;
  const maxTotalUnits = limits.maxTotalUnits ?? 36;
  const title = String(value || "").trim().replace(/[。；;]+$/, "");
  if (!title) return { status: "rewrite-required", lines: [], reasons: ["页面行动标题不能为空"] };
  if (cjkUnits(title) > maxTotalUnits) return { status: "rewrite-required", lines: [], reasons: [`标题总宽${cjkUnits(title).toFixed(1)}超过${maxTotalUnits}，必须先提炼命题`] };
  if (cjkUnits(title) <= maxLineUnits) {
    const validation = validateCjkLines([title], { maxLineUnits, maxTotalUnits });
    return { status: validation.passed ? "fit" : "rewrite-required", lines: [title], reasons: validation.errors };
  }
  for (const candidate of candidateBreaks(title)) {
    const lines = [title.slice(0, candidate.offset).trim(), title.slice(candidate.offset).trim()];
    const validation = validateCjkLines(lines, { maxLineUnits, maxTotalUnits });
    if (validation.passed) return { status: "fit", lines, reasons: [] };
  }
  return { status: "rewrite-required", lines: [], reasons: ["找不到符合中文禁则和两行容量的语义断点；必须缩短标题或更换页面命题"] };
}

export function protectCjkTokensHtml(value, escapeHtml) {
  const input = String(value || "");
  const tokens = protectedTokens(input);
  if (!tokens.length) return escapeHtml(input);
  let cursor = 0;
  let html = "";
  tokens.forEach((token) => {
    html += escapeHtml(input.slice(cursor, token.start));
    html += `<span class="cjk-token">${escapeHtml(token.text)}</span>`;
    cursor = token.end;
  });
  return html + escapeHtml(input.slice(cursor));
}
