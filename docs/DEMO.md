# README walkthrough

`media/demo/walkthrough.gif` is a 27-second, looping walkthrough captured from the real extension in a separate VS Code development profile. Both READMEs use the same English-language demo. `media/demo/preview.png` provides a static alternative.

The animation uses selected screenshots, cropped close-ups, short crossfades and step captions. The last scene is a rendering of the PDF actually exported during the walkthrough. It does not simulate forms or change the extension UI. Recordly was considered as an optional recorder; this version was assembled from native window captures with Pillow, without installing Recordly.

## Capture scenario

Use an isolated profile, the English interface, Dark Modern theme, a saved `checkout.ts` sample and fictional review data. Keep raw captures and generated reports under the ignored `work/readme-demo/` directory. Capture the application window at 2880 × 1800 pixels; the current crops assume those dimensions.

| Capture              | State                                                   |
| -------------------- | ------------------------------------------------------- |
| `01-start.png`       | Review panel with Start Code Review and the sample file |
| `02-form.png`        | Empty start form                                        |
| `03-details.png`     | Filled task and people fields before saving             |
| `04-selection.png`   | Saved review with the problematic code line selected    |
| `06-note-empty.png`  | Add Review Note form with captured module and line      |
| `07-note-filled.png` | Comment, source and Major severity filled in            |
| `08-saved.png`       | Saved note visible in the expanded review tree          |
| `09-export.png`      | Completion format picker with Markdown + PDF selected   |

The sample task is SHOP-142, “Validate checkout totals”, with Alex Morgan as assignee and Sam Taylor as reviewer. The note asks to reject discounts larger than the order total. Use sample data only; avoid recording private project paths, notifications or credentials.

## Rebuild

Requires Python 3 with Pillow, plus Poppler to render the exported PDF. These are documentation tools, not extension runtime dependencies.

```sh
pdftoppm -scale-to 1400 -singlefile -png \
  work/readme-demo/reports/SHOP-142/SHOP-142_Validate-checkout-totals_review-01.pdf \
  work/readme-demo/report-pdf

python3 scripts/build-demo.py \
  --captures work/readme-demo/frames \
  --pdf-preview work/readme-demo/report-pdf.png \
  --font media/fonts/NotoSans-Regular.ttf
```

The builder writes the GIF and static PNG to `media/demo/`. Review all scenes at full size after rebuilding: text must remain readable, form buttons visible, and the final report must match the saved note. The current GIF is 1280 × 900 pixels with 33 frames, lasts 27.12 seconds and is about 1.4 MiB.

The images are included in the VSIX. VSCE rewrites README image links to repository URLs for the listing, so commit and push the assets together with the README before relying on their availability on GitHub or Marketplace.
