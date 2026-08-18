#!/usr/bin/env python3
"""Read-only PPTX text/notes extractor used by cross-output QA."""

from __future__ import annotations

import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}


def natural_key(name: str) -> tuple[int, str]:
    match = re.search(r"(\d+)\.xml$", name)
    return (int(match.group(1)) if match else 10**9, name)


def xml_text(blob: bytes) -> list[str]:
    root = ET.fromstring(blob)
    return [node.text or "" for node in root.findall(".//a:t", NS) if (node.text or "").strip()]


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 extract-pptx-content.py report.pptx", file=sys.stderr)
        return 2
    source = Path(sys.argv[1]).resolve()
    if not source.exists():
        print(json.dumps({"passed": False, "status": "unverified", "error": f"missing PPTX: {source}"}, ensure_ascii=False))
        return 1
    try:
        with zipfile.ZipFile(source) as archive:
            names = set(archive.namelist())
            slide_names = sorted(
                [name for name in names if re.fullmatch(r"ppt/slides/slide\d+\.xml", name)],
                key=natural_key,
            )
            slides = []
            for index, slide_name in enumerate(slide_names):
                text_runs = xml_text(archive.read(slide_name))
                rel_name = slide_name.replace("ppt/slides/", "ppt/slides/_rels/") + ".rels"
                note_runs = []
                if rel_name in names:
                    rel_root = ET.fromstring(archive.read(rel_name))
                    for rel in rel_root:
                        if str(rel.attrib.get("Type", "")).endswith("/notesSlide"):
                            target = str(rel.attrib.get("Target", "")).replace("../", "ppt/").lstrip("/")
                            if target in names:
                                note_runs = xml_text(archive.read(target))
                            break
                slides.append(
                    {
                        "index": index + 1,
                        "textRuns": text_runs,
                        "text": "\n".join(text_runs),
                        "notes": "\n".join(note_runs),
                    }
                )
            result = {
                "passed": True,
                "status": "verified",
                "file": str(source),
                "pageCount": len(slides),
                "notesCount": sum(1 for slide in slides if slide["notes"]),
                "slides": slides,
            }
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return 0
    except Exception as exc:  # Parsing failure must never be presented as verified.
        print(json.dumps({"passed": False, "status": "unverified", "error": str(exc), "file": str(source)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
