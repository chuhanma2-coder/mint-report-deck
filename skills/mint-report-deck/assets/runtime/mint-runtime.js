/* Mint Living Intelligence runtime.
 * Navigation behavior is informed by the MIT-licensed frontend-slides and
 * beautiful-html-templates projects by Zara Zhang. Mint-specific navigation,
 * lightbox, disclosure, chart, and inline-editing behavior is implemented here.
 */

class MintDeck {
  constructor(root = document) {
    this.root = root;
    this.stage = root.querySelector("#mintDeckStage");
    this.slides = [...root.querySelectorAll(".slide")];
    this.index = this.indexFromHash();
    this.wheelLocked = false;
    this.touchStart = null;
    this.editing = false;
    this.nav = root.querySelector("#deckNav");
    this.navList = root.querySelector("#navList");
    this.lightbox = root.querySelector("#lightbox");
    this.drawer = root.querySelector("#drawer");
    this.toast = root.querySelector("#editToast");
    this.storageKey = this.buildStorageKey();
    this.buildNavigation();
    this.bindNavigation();
    this.bindModalInteractions();
    this.bindDisclosure();
    this.bindEditing();
    this.restoreEdits();
    this.renderCharts();
    this.fit();
    this.show(this.index, "init");
  }

  indexFromHash() {
    const n = Number((location.hash || "").replace("#slide-", ""));
    return Number.isFinite(n) && n > 0 ? n - 1 : 0;
  }

  buildStorageKey() {
    const deckId = this.root.querySelector('meta[name="mint-deck-id"]')?.content || "untitled";
    const deckVersion = this.root.querySelector('meta[name="mint-deck-version"]')?.content || "1";
    return `mint-deck-edits:${deckId}:${deckVersion}`;
  }

  fit() {
    const factor = Math.min(innerWidth / 1920, innerHeight / 1080);
    const x = (innerWidth - 1920 * factor) / 2;
    const y = (innerHeight - 1080 * factor) / 2;
    this.stage.style.transform = `translate(${x}px, ${y}px) scale(${factor})`;
  }

  show(next, reason = "api") {
    const bounded = Math.max(0, Math.min(next, this.slides.length - 1));
    this.index = bounded;
    this.slides.forEach((slide, i) => {
      const active = i === bounded;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    [...this.navList.querySelectorAll(".nav-item")].forEach((item, i) => {
      item.classList.toggle("is-active", i === bounded);
      item.setAttribute("aria-current", i === bounded ? "page" : "false");
    });
    history.replaceState(null, "", `#slide-${bounded + 1}`);
    document.title = `${this.slides[bounded].dataset.title || "Mint"} · Mint`;
    this.stage.dispatchEvent(new CustomEvent("mintslidechange", {
      detail: { index: bounded, slide: this.slides[bounded], reason }
    }));
  }

  buildNavigation() {
    this.navList.innerHTML = "";
    this.slides.forEach((slide, i) => {
      const button = document.createElement("button");
      button.className = "nav-item";
      button.type = "button";
      button.title = slide.dataset.title || `第 ${i + 1} 页`;
      button.innerHTML = `<span class="nav-dot"></span><span class="nav-label">${String(i + 1).padStart(2, "0")} · ${this.escapeHtml(button.title)}</span>`;
      button.addEventListener("click", () => this.show(i, "nav"));
      this.navList.appendChild(button);
    });
  }

  bindNavigation() {
    addEventListener("resize", () => this.fit(), { passive: true });
    addEventListener("hashchange", () => this.show(this.indexFromHash(), "hash"));
    document.addEventListener("keydown", (event) => {
      if (this.editing && event.target?.isContentEditable) return;
      if (this.lightbox.classList.contains("is-open") || this.drawer.classList.contains("is-open")) {
        if (event.key === "Escape") this.closeModals();
        return;
      }
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        this.show(this.index + 1, "keyboard");
      }
      if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        this.show(this.index - 1, "keyboard");
      }
      if (event.key === "Home") this.show(0, "keyboard");
      if (event.key === "End") this.show(this.slides.length - 1, "keyboard");
      if ((event.key === "e" || event.key === "E") && !event.metaKey && !event.ctrlKey) this.toggleEditing();
      if ((event.key === "f" || event.key === "F") && !event.metaKey && !event.ctrlKey) this.toggleFullscreen();
      if ((event.key === "p" || event.key === "P") && !event.metaKey && !event.ctrlKey) this.toggleExportMenu();
      if (event.key === "Escape") this.toggleExportMenu(false);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        this.persistEdits();
        this.notify("文字修改已保存在当前浏览器");
      }
    });
    document.addEventListener("wheel", (event) => {
      if (this.editing || this.wheelLocked || Math.abs(event.deltaY) < 18) return;
      this.wheelLocked = true;
      this.show(this.index + (event.deltaY > 0 ? 1 : -1), "wheel");
      setTimeout(() => { this.wheelLocked = false; }, 620);
    }, { passive: true });
    document.addEventListener("touchstart", (event) => {
      const t = event.touches[0];
      this.touchStart = { x: t.clientX, y: t.clientY };
    }, { passive: true });
    document.addEventListener("touchend", (event) => {
      if (!this.touchStart) return;
      const t = event.changedTouches[0];
      const dx = this.touchStart.x - t.clientX;
      const dy = this.touchStart.y - t.clientY;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) this.show(this.index + (dx > 0 ? 1 : -1), "swipe");
      this.touchStart = null;
    }, { passive: true });
  }

  bindModalInteractions() {
    this.root.querySelectorAll("[data-lightbox]").forEach((media) => {
      media.addEventListener("click", () => {
        const source = media.matches("img,video") ? media : media.querySelector("img,video");
        if (!source) return;
        const clone = source.cloneNode(true);
        if (clone.tagName === "VIDEO") clone.controls = true;
        this.lightbox.querySelector(".lightbox-content").replaceChildren(clone);
        this.lightbox.classList.add("is-open");
        this.lightbox.setAttribute("aria-hidden", "false");
      });
    });
    this.root.querySelectorAll("[data-modal-close]").forEach((button) => button.addEventListener("click", () => this.closeModals()));
    [this.lightbox, this.drawer].forEach((modal) => modal.addEventListener("click", (event) => {
      if (event.target === modal) this.closeModals();
    }));
  }

  bindDisclosure() {
    this.root.querySelectorAll("[data-drawer-target]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const template = this.root.querySelector(`#${CSS.escape(trigger.dataset.drawerTarget)}`);
        if (!template) return;
        this.drawer.querySelector(".drawer-panel").innerHTML = template.innerHTML;
        this.drawer.classList.add("is-open");
        this.drawer.setAttribute("aria-hidden", "false");
      });
    });
  }

  closeModals() {
    [this.lightbox, this.drawer].forEach((modal) => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    });
    this.lightbox.querySelectorAll("video").forEach((video) => video.pause());
  }

  bindEditing() {
    this.root.querySelector("#editButton")?.addEventListener("click", () => this.toggleEditing());
    this.root.querySelector("#downloadButton")?.addEventListener("click", () => this.toggleExportMenu());
    this.root.querySelector("#exportHtmlButton")?.addEventListener("click", () => this.downloadHtml());
    this.root.querySelector("#exportPdfButton")?.addEventListener("click", () => this.exportPdf());
    this.root.querySelector("#fullscreenButton")?.addEventListener("click", () => this.toggleFullscreen());
    const textSelectors = [
      ".slide h1", ".slide h2", ".slide h3", ".slide h4", ".slide p", ".slide li",
      ".slide td", ".slide th", ".slide small", ".slide .eyebrow", ".slide .status",
      ".slide .tag", ".slide .persona span", ".slide .anatomy-item", ".slide .domain-core span",
      ".slide .layer-label", ".slide .layer-items span", ".slide .layer-outcome",
      ".slide .loop-node", ".slide .filter-item", ".slide .ask span", ".slide .chapter-number",
      ".slide .chapter-title", ".slide .chapter-subtitle", ".slide .image-caption"
    ].join(",");
    this.root.querySelectorAll(textSelectors).forEach((node) => {
      if (!node.closest(".chrome") && !node.closest("button") && !node.hasAttribute("data-no-edit")) node.setAttribute("data-editable", "");
    });
    this.root.querySelectorAll(".slide *").forEach((node) => {
      const tag = node.tagName?.toLowerCase();
      const structuredValue = node.hasAttribute("data-structured-value");
      const excluded = ["script", "style", "template", "svg", "path", "img", "video", "audio", "button", "input"].includes(tag);
      const isLeafText = node.children.length === 0 && node.textContent.trim().length > 0;
      if ((!excluded || structuredValue) && isLeafText && (!node.closest("button") || structuredValue) && !node.hasAttribute("data-no-edit")) node.setAttribute("data-editable", "");
    });
    this.root.querySelectorAll("[data-editable]").forEach((node, i) => {
      if (!node.dataset.editId) node.dataset.editId = `edit-${i + 1}`;
      node.addEventListener("input", () => {
        if (node.hasAttribute("data-structured-value")) this.updateStructuredNumber(node);
        this.persistEdits();
      });
    });
  }

  updateStructuredNumber(node) {
    const segment = node.closest(".quant-segment");
    const group = node.closest(".quant-group");
    if (!segment || !group) return;
    const parsed = Number(String(node.textContent).replace(/[^0-9.+-]/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) {
      group.dataset.numericState = "invalid";
      group.classList.add("has-numeric-error");
      this.notify("数字格式无效，正式导出前需要修正");
      return;
    }
    const total = Number(group.dataset.total || 100);
    segment.dataset.value = String(parsed);
    segment.style.setProperty("--segment", `${Math.max(0, parsed / total * 100)}%`);
    const sum = [...group.querySelectorAll(".quant-segment")].reduce((value, item) => value + Number(item.dataset.value || 0), 0);
    const valid = Math.abs(sum - total) < 0.0001;
    group.dataset.numericState = valid ? "valid" : "invalid";
    group.classList.toggle("has-numeric-error", !valid);
    this.updateEmbeddedClaim(segment.dataset.claimRef, parsed);
    this.notify(valid ? "数字与构成已同步" : `构成合计 ${sum}，应为 ${total}；正式导出将被阻断`);
  }

  updateEmbeddedClaim(claimId, value) {
    if (!claimId) return;
    const dataNode = this.root.querySelector("#mint-deck-data");
    if (!dataNode) return;
    try {
      const model = JSON.parse(dataNode.textContent);
      for (const slide of model.slides || []) {
        const visit = (candidate) => {
          for (const group of candidate?.data?.groups || []) {
            for (const segment of group.segments || []) if (segment.claimRef === claimId) segment.value = value;
          }
        };
        visit(slide.primaryVisual);
        for (const module of slide.supportModules || []) visit(module);
      }
      dataNode.textContent = JSON.stringify(model).replace(/</g, "\\u003c");
    } catch {
      this.notify("结构化数据同步失败，正式导出前需要重新生成");
    }
  }

  toggleEditing(force) {
    this.editing = typeof force === "boolean" ? force : !this.editing;
    this.root.querySelectorAll("[data-editable]").forEach((node) => {
      node.contentEditable = this.editing ? "true" : "false";
      node.classList.toggle("edit-outline", this.editing);
    });
    this.root.querySelector("#editButton")?.classList.toggle("is-active", this.editing);
    this.notify(this.editing ? "编辑模式：点击文字即可修改，按 ⌘/Ctrl+S 保存" : "已退出编辑模式");
  }

  persistEdits() {
    const edits = {};
    this.root.querySelectorAll("[data-editable][data-edit-id]").forEach((node) => {
      edits[node.dataset.editId] = node.innerHTML;
    });
    localStorage.setItem(this.storageKey, JSON.stringify(edits));
  }

  restoreEdits() {
    try {
      const edits = JSON.parse(localStorage.getItem(this.storageKey) || "{}");
      Object.entries(edits).forEach(([id, html]) => {
        const node = this.root.querySelector(`[data-edit-id="${CSS.escape(id)}"]`);
        if (node) node.innerHTML = html;
      });
    } catch { /* ignore corrupted local drafts */ }
  }

  downloadHtml() {
    if (this.root.querySelector(".quant-group.has-numeric-error")) {
      this.notify("数字构成未闭合，已阻止下载正式 HTML");
      return;
    }
    this.persistEdits();
    this.toggleEditing(false);
    const source = `<!doctype html>\n${document.documentElement.outerHTML}`;
    const blob = new Blob([source], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `mint-deck-${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    this.notify("已下载修改后的 HTML");
  }

  toggleExportMenu(force) {
    const menu = this.root.querySelector("#exportMenu");
    if (!menu) return;
    const open = typeof force === "boolean" ? force : !menu.classList.contains("is-open");
    menu.classList.toggle("is-open", open);
    this.root.querySelector("#downloadButton")?.classList.toggle("is-active", open);
  }

  exportPdf() {
    if (this.root.querySelector(".quant-group.has-numeric-error")) {
      this.notify("数字构成未闭合，已阻止导出正式 PDF");
      return;
    }
    this.persistEdits();
    this.toggleEditing(false);
    this.closeModals();
    this.toggleExportMenu(false);
    this.notify("请在打印窗口中选择“存储为 PDF”");
    setTimeout(() => window.print(), 60);
  }

  async toggleFullscreen() {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  }

  notify(message) {
    this.toast.textContent = message;
    this.toast.classList.add("is-visible");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.classList.remove("is-visible"), 2300);
  }

  renderCharts() {
    this.root.querySelectorAll("[data-mint-chart]").forEach((host) => this.renderChart(host));
  }

  renderChart(host) {
    const dataNode = host.querySelector("script[type='application/json']");
    if (!dataNode) return;
    const model = JSON.parse(dataNode.textContent);
    const plot = host.querySelector(".chart-plot");
    const legend = host.querySelector(".chart-legend");
    const range = host.querySelector("input[type='range']");
    const tooltip = host.querySelector(".chart-tooltip");
    const hidden = new Set();
    const palette = ["#12695d", "#2b6288", "#bd7227", "#43b36d"];

    model.series.forEach((series, i) => {
      series.color = series.color || palette[i % palette.length];
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `<span class="chart-swatch" style="--series-color:${series.color}"></span>${this.escapeHtml(series.name)}`;
      button.addEventListener("click", () => {
        hidden.has(i) ? hidden.delete(i) : hidden.add(i);
        button.classList.toggle("is-off", hidden.has(i));
        draw();
      });
      legend.appendChild(button);
    });

    if (range) {
      range.max = Math.max(0, model.labels.length - (model.window || 6));
      range.value = 0;
    }

    const draw = () => {
      const windowSize = Math.min(model.window || model.labels.length, model.labels.length);
      const start = range ? Number(range.value) : 0;
      const labels = model.labels.slice(start, start + windowSize);
      const series = model.series.map((item) => ({ ...item, values: item.values.slice(start, start + windowSize) }));
      const width = 1500;
      const height = 430;
      const margin = { left: 82, right: 25, top: 28, bottom: 58 };
      const values = series.flatMap((item, i) => hidden.has(i) ? [] : item.values);
      const max = Math.max(...values, 1);
      const yMax = Math.ceil(max / 10) * 10;
      const xStep = (width - margin.left - margin.right) / labels.length;
      const chartH = height - margin.top - margin.bottom;
      const y = (value) => margin.top + chartH - (value / yMax) * chartH;
      const x = (i) => margin.left + xStep * i + xStep / 2;
      let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${this.escapeHtml(model.title || "互动图表")}">`;
      for (let tick = 0; tick <= 4; tick += 1) {
        const value = (yMax / 4) * tick;
        const yy = y(value);
        svg += `<line x1="${margin.left}" x2="${width - margin.right}" y1="${yy}" y2="${yy}" stroke="rgba(23,32,29,.13)" stroke-dasharray="5 8"/>`;
        svg += `<text x="${margin.left - 18}" y="${yy + 6}" text-anchor="end" fill="#52615b" font-family="IBM Plex Mono" font-size="15">${value}</text>`;
      }
      labels.forEach((label, i) => {
        svg += `<text x="${x(i)}" y="${height - 20}" text-anchor="middle" fill="#52615b" font-family="IBM Plex Mono" font-size="15">${this.escapeHtml(label)}</text>`;
      });
      series.forEach((item, seriesIndex) => {
        if (hidden.has(seriesIndex)) return;
        if (item.type === "bar") {
          const activeBars = series.filter((s, i) => s.type === "bar" && !hidden.has(i));
          const barIndex = activeBars.findIndex((s) => s.name === item.name);
          const totalWidth = Math.min(xStep * .68, 108);
          const barWidth = totalWidth / Math.max(1, activeBars.length);
          item.values.forEach((value, i) => {
            const xx = x(i) - totalWidth / 2 + barIndex * barWidth;
            const yy = y(value);
            svg += `<rect class="chart-mark" data-label="${this.escapeHtml(labels[i])}" data-series="${this.escapeHtml(item.name)}" data-value="${value}" x="${xx}" y="${yy}" width="${Math.max(8, barWidth - 5)}" height="${margin.top + chartH - yy}" fill="${item.color}" rx="3" opacity=".9"/>`;
          });
        } else {
          const points = item.values.map((value, i) => `${x(i)},${y(value)}`).join(" ");
          svg += `<polyline points="${points}" fill="none" stroke="${item.color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
          item.values.forEach((value, i) => {
            svg += `<circle class="chart-mark" data-label="${this.escapeHtml(labels[i])}" data-series="${this.escapeHtml(item.name)}" data-value="${value}" cx="${x(i)}" cy="${y(value)}" r="8" fill="${item.color}" stroke="#fff8ea" stroke-width="4"/>`;
          });
        }
      });
      svg += "</svg>";
      plot.innerHTML = svg;
      plot.querySelectorAll(".chart-mark").forEach((mark) => {
        mark.style.cursor = "crosshair";
        mark.addEventListener("pointerenter", (event) => {
          tooltip.innerHTML = `<strong>${mark.dataset.label}</strong><br>${mark.dataset.series}：${mark.dataset.value}${model.unit || ""}`;
          tooltip.classList.add("is-visible");
          positionTooltip(event);
        });
        mark.addEventListener("pointermove", positionTooltip);
        mark.addEventListener("pointerleave", () => tooltip.classList.remove("is-visible"));
      });
    };

    const positionTooltip = (event) => {
      const rect = host.getBoundingClientRect();
      const stageScale = rect.width / 1920;
      tooltip.style.left = `${(event.clientX - rect.left) / stageScale + 18}px`;
      tooltip.style.top = `${(event.clientY - rect.top) / stageScale - 28}px`;
    };
    range?.addEventListener("input", draw);
    draw();
  }

  escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
  }
}

addEventListener("DOMContentLoaded", () => {
  window.mintDeck = new MintDeck(document);
});
