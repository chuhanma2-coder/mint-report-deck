# Export contract V0.6

Formal generation produces `report.html`, `report.pdf` and `export-manifest.json` in the same output directory.

## Honest UI states

- `下载 PDF`: shown only when a matching pre-generated PDF exists. One click downloads the file.
- `打印 / 导出当前版本`: shown when no matching PDF exists. It opens the browser print dialog and explicitly tells the user to choose “存储为 PDF”.
- `打印 / 导出当前编辑版`: shown after inline edits because the pre-generated PDF no longer contains those edits.

`export-manifest.json` records deck id/version, HTML/PDF SHA-256 hashes, content hash, page count and generation time. The exporter must preserve the HTML if browser startup or PDF generation fails.

Run:

```bash
bash scripts/export-pdf.sh outputs/task/report.html outputs/task/report.pdf outputs/task/export-manifest.json
```
