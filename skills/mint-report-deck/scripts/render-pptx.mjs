#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";
import { buildFrameMap } from "./renderers/pptx/source-map.mjs";
import { editMintSlide } from "./renderers/pptx/edit-slide.mjs";

async function saveBlob(file, blob) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, Buffer.from(await blob.arrayBuffer()));
}

const [deckArg, outputArg, templateArg] = process.argv.slice(2);
if (!deckArg || !outputArg) {
  console.error("Usage: node render-pptx.mjs deck-spec.json report.pptx [Mint_Report_Component_Library.pptx]");
  process.exit(2);
}

const deckFile = path.resolve(deckArg);
const output = path.resolve(outputArg);
const skillRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const template = path.resolve(templateArg || path.join(skillRoot, "assets/presentation/Mint_Report_Component_Library.pptx"));
const work = path.join(path.dirname(output), ".pptx-work");
const previewDir = path.join(work, "previews");
const layoutDir = path.join(work, "layouts");
const deck = JSON.parse(await fs.readFile(deckFile, "utf8"));
if (!Array.isArray(deck.slides) || !deck.slides.length) throw new Error("deck-spec must contain at least one slide");

const frameMap = buildFrameMap(deck);
await fs.mkdir(work, { recursive: true });
await fs.writeFile(path.join(work, "template-frame-map.json"), `${JSON.stringify(frameMap, null, 2)}\n`);
await fs.writeFile(path.join(work, "template-deviation-log.txt"), [
  "All output pages duplicate a controlled Mint source page.",
  "Four-item capability sets use the four-band source page instead of a false arrow sequence.",
  "Unsupported relationships stop with needs-layout-review.",
  "No blank-slide or full-slide-image fallback is permitted."
].join("\n"));

const presentation = await PresentationFile.importPptx(await FileBlob.load(template));
const originals = [...presentation.slides.items];
const outputs = frameMap.outputSlides.map((frame) => ({ frame, slide: originals[frame.sourceSlide - 1].duplicate() }));
for (const slide of originals) slide.delete();
for (let i = 0; i < outputs.length; i += 1) outputs[i].slide.moveTo(i);

for (let i = 0; i < outputs.length; i += 1) editMintSlide(outputs[i].slide, outputs[i].frame, deck.slides[i], i, outputs.length);

await fs.mkdir(previewDir, { recursive: true });
await fs.mkdir(layoutDir, { recursive: true });
for (let i = 0; i < outputs.length; i += 1) {
  const stem = `slide-${String(i + 1).padStart(2, "0")}`;
  await saveBlob(path.join(previewDir, `${stem}.png`), await presentation.export({ slide: outputs[i].slide, format: "png", scale: 1 }));
  const layout = await outputs[i].slide.export({ format: "layout" });
  await fs.writeFile(path.join(layoutDir, `${stem}.layout.json`), await layout.text());
}
await saveBlob(path.join(work, "deck-montage.webp"), await presentation.export({ format: "webp", montage: true, scale: 1 }));
const inspect = await presentation.inspect({ kind: "slide,textbox,shape,image,table,chart,notes,layout", maxChars: 200000 });
await fs.writeFile(path.join(work, "report.inspect.ndjson"), inspect.ndjson);
await fs.mkdir(path.dirname(output), { recursive: true });
const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(output);
const stat = await fs.stat(output);
console.log(JSON.stringify({ passed: stat.size > 0, output, bytes: stat.size, slides: outputs.length, frameMap: path.join(work, "template-frame-map.json"), previews: previewDir, layouts: layoutDir }, null, 2));
