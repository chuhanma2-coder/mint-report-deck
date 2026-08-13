#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const input = path.resolve(process.argv[2] || "");
const output = path.resolve(process.argv[3] || "presentation-content.json");
if (!process.argv[2] || !fs.existsSync(input)) {
  console.error("Usage: node build-presentation-content.mjs /absolute/path/deck-spec.json /absolute/path/presentation-content.json");
  process.exit(2);
}
const deck = JSON.parse(fs.readFileSync(input, "utf8"));
if (!["0.2", "0.3"].includes(deck.schemaVersion) || !Array.isArray(deck.slides)) throw new Error("deck-spec must use schemaVersion 0.2 or 0.3");
const content = {
  schemaVersion: deck.schemaVersion,
  template: "assets/presentation/Mint_Report_Component_Library.pptx",
  deckId: deck.id,
  title: deck.title,
  pageCount: deck.slides.length,
  slides: deck.slides.map((slide, index) => ({
    order: index + 1,
    recipe: slide.type,
    titleLines: slide.titleLines || [],
    content: Object.fromEntries(Object.entries(slide).filter(([key]) => !["type", "titleLines", "sourceRefs"].includes(key))),
    sourceRefs: slide.sourceRefs || []
  }))
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(content, null, 2)}\n`);
console.log(output);
