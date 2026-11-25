# Citizen ID extractor handoff

The extractor runs Tesseract locally in the browser using bundled assets. Users can add front and back images, review and edit extracted fields, and reset saved browser data. OCR results require review; image and field data are stored in this browser until reset.

The ID merge preserves leading zeros and accepts a color-pass candidate only when it agrees with a unique primary front-pass sequence. Conflicting or ambiguous readings are withheld. Independent testing on one authorized image pair confirmed an exact ID match; this is not a guarantee for other cards.

## Remaining work

- Residence and issuing authority were blank on that pair. A proposed parser that accepted headings inside lines produced conflicting residence readings and a false positive on an unrelated synthetic note, so it was not integrated. Investigate layout-aware OCR and bounded parsing with varied synthetic card layouts; reject ambiguous or partial results rather than infer content.
- Vietnamese name recognition can lose diacritics. The review interface offers differing OCR name suggestions where the letters agree, but users must verify the card. Evaluate recognition improvements against diverse synthetic names and consented images without inventing accents.
- Test any candidate against the current extractor for all seven fields, exact values, conflicts, and end-to-end time. Include mobile and other browsers before making broader compatibility or performance claims.

## Checks and privacy

Run `node --test tests/citizen-id.test.mjs`, `npx tsc --noEmit`, `npm run build`, and `npm run lint`. The synthetic suite covers multiline fields, conflicts, malformed IDs, and leading zeros. Full lint currently reports existing `react-hooks/set-state-in-effect` errors in `components/ui/carousel.tsx:98` and `hooks/use-mobile.ts:14`; the extractor also has a Next.js image-element warning.

Use synthetic fixtures for routine tests. Process consented images locally, never put card images or recognized personal data in source, logs, screenshots, test artifacts, or external services. Clear browser data after sensitive tests and verify deletion. A previous local check saw only localhost resource origins; it was not a comprehensive network audit.
