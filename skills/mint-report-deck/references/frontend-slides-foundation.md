# frontend-slides adoption record

Reviewed upstream: `zarazhangrui/frontend-slides` at commit `9906a34d640d2111f724544cbc50f7f130569ae1` under the MIT License.

Adopted and adapted:

- fixed 1920×1080 stage scaled uniformly to the viewport;
- one standalone HTML deliverable with embedded runtime and media;
- keyboard, wheel and touch navigation plus hash-addressable pages;
- hover-expanded page-title navigation;
- print-isolated 16:9 output;
- progressive disclosure, media lightbox and restrained entrance motion;
- editable text and downloadable post-edit HTML;
- visual QA at desktop, 1280×720 and phone viewports;
- PowerPoint/source extraction and PDF-export concepts where host tools permit them.

Intentionally not adopted:

- unrestricted style generation and per-deck global CSS;
- English-first typography and automatic character wrapping;
- decorative chart generation without an evidence contract;
- layout novelty as a goal independent of narrative meaning.

Mint adds a fixed Chinese type system, semantic title breaks, controlled components, evidence states, chart guards, deck-scoped edit storage and formal-report content rules. See the root `THIRD_PARTY_NOTICES.md` for attribution.
