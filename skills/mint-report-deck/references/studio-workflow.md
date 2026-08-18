# Offline form editor workflow

Deliver `mint-studio.html` as one self-contained file with no CDN or runtime installation.

The editor must provide:

1. Page list with reorder and add-page controls.
2. Forms for purpose, takeaway, relationship, allowed component, fixed layout, structured content, sources, and review status.
3. Real-time 16:9 preview using fixed Mint layouts.
4. An outline map showing the complete narrative flow.
5. A source panel and review/formal source visibility toggle.
6. Save project JSON, import project JSON, download formal HTML, and print PDF.

Do not expose free drag, arbitrary resize, coordinates, CSS, or a raw DOM editor in V1.1. When the user changes a relationship, restrict the component selector to compatible options.

Formal HTML hides detailed evidence controls and retains only a concise source footer. The evidence ledger retains full locators and excerpts. Print CSS must set a 16:9 page, zero margin, one slide per page, final animation state, exact colors, and no editor/navigation controls.
