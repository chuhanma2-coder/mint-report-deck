import { protectCjkTokensHtml } from "../cjk-text-fit.mjs";

export const arr = (value) => Array.isArray(value) ? value : [];

export const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
}[char]));

export const compactText = (value) => String(value || "")
  .replace(/<script[\s\S]*?<\/script>/gi, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/[\s，。；：、,.!?！？—-]/g, "");

export function emphasized(value, slide) {
  let safe = protectCjkTokensHtml(value, escapeHtml);
  for (const term of arr(slide?.emphasis?.terms).sort((a, b) => String(b).length - String(a).length)) {
    const escaped = escapeHtml(term);
    safe = safe.split(escaped).join(`<strong class="term-emphasis">${escaped}</strong>`);
  }
  return safe;
}

export function cjkText(value) {
  return protectCjkTokensHtml(value, escapeHtml);
}

export const attrList = (values) => escapeHtml(arr(values).filter(Boolean).join(" "));

export function zoneStyle(zone) {
  const b = zone?.bounds || {};
  return `--zone-x:${Number(b.x || 0)}px;--zone-y:${Number(b.y || 0)}px;--zone-w:${Number(b.width || 0)}px;--zone-h:${Number(b.height || 0)}px`;
}

export function zoneShell(zone, inner, extraClass = "") {
  if (!zone) return "";
  return `<div class="v06-zone v06-zone--${escapeHtml(zone.role)} ${escapeHtml(extraClass)}" data-zone-id="${escapeHtml(zone.id)}" data-reading-order="${escapeHtml(zone.readingOrder)}" style="${zoneStyle(zone)}">${inner}</div>`;
}

export function sourceText(slide, deck) {
  return slide.source || slide.chapter || deck.confidentiality || "内部材料";
}

export function visibleClaimItems(slide) {
  return arr(slide.visibleClaims).map((claim, index) => ({
    id: `claim-${index + 1}`,
    title: claim.label || claim.text || `要点 ${index + 1}`,
    detail: claim.detail || "",
    atomRefs: arr(claim.atomRefs)
  }));
}

export function normalizedItems(slide) {
  const claims = arr(slide.visibleClaims);
  const withClaimRefs = (item, index) => ({...item, atomRefs:arr(item.atomRefs).length ? arr(item.atomRefs) : arr(claims[index]?.atomRefs)});
  if (arr(slide.items).length) return arr(slide.items).map((item, index) => withClaimRefs({
    id: item.id || `item-${index + 1}`,
    title: item.title || item.name || item.label || item.time || `要点 ${index + 1}`,
    detail: item.detail || item.subtitle || item.text || "",
    kicker: item.time || item.stage || item.role || "",
    atomRefs: arr(item.atomRefs)
  }, index));
  if (arr(slide.columns).length) return arr(slide.columns).map((item, index) => withClaimRefs({
    id: item.id || `column-${index + 1}`,
    title: item.title || item.label || `要点 ${index + 1}`,
    detail: arr(item.items).join("；") || item.detail || "",
    kicker: item.subtitle || "",
    atomRefs: arr(item.atomRefs)
  }, index));
  if (arr(slide.stages).length) return arr(slide.stages).map((item, index) => withClaimRefs({
    id: item.id || `stage-${index + 1}`,
    title: item.name || item.title || `阶段 ${index + 1}`,
    detail: item.capability || item.detail || arr(item.entities).join("、"),
    kicker: item.role || "",
    atomRefs: arr(item.atomRefs)
  }, index));
  if (arr(slide.layers).length) return arr(slide.layers).map((item, index) => withClaimRefs({
    id: item.id || `layer-${index + 1}`,
    title: item.name || item.title || `层级 ${index + 1}`,
    detail: item.detail || arr(item.entities).map((entity) => entity.name || entity).join("、"),
    kicker: item.role || "",
    atomRefs: arr(item.atomRefs)
  }, index));
  return visibleClaimItems(slide);
}

export function renderItem(item, index, className = "v06-item") {
  return `<article class="${escapeHtml(className)}" data-element-id="${escapeHtml(item.id || `item-${index + 1}`)}" data-atom-refs="${attrList(item.atomRefs)}"><small>${cjkText(item.kicker || String(index + 1).padStart(2, "0"))}</small><h3>${cjkText(item.title || "")}</h3>${item.detail ? `<p>${cjkText(item.detail)}</p>` : ""}</article>`;
}

export function renderConnectors(slide, expectedCount = Infinity) {
  return arr(slide.connectors).slice(0, expectedCount).map((connector) => `<span class="v06-semantic-connector v06-semantic-connector--${escapeHtml(connector.connectorType || "line")}" data-connector-id="${escapeHtml(connector.id)}" data-relation-ref="${escapeHtml(connector.relationRef)}" data-from-element="${escapeHtml(connector.fromElementId)}" data-to-element="${escapeHtml(connector.toElementId)}" aria-hidden="true"><i></i></span>`).join("");
}

export function renderSupportModules(slide) {
  const modules = arr(slide.supportModules);
  if (!modules.length) return "";
  return `<div class="v06-support-list">${modules.map((module, index) => `<article class="v06-support v06-support--${escapeHtml(module.kind || "note")}" data-module-kind="${escapeHtml(module.kind || "note")}" data-atom-refs="${attrList(module.atomRefs)}" data-claim-refs="${attrList(module.claimRefs)}"><small>${cjkText(module.data?.label || `补充 ${index + 1}`)}</small><strong>${cjkText(module.data?.value || module.data?.text || "")}</strong>${module.data?.detail ? `<p>${cjkText(module.data.detail)}</p>` : ""}</article>`).join("")}</div>`;
}
