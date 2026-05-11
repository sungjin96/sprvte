# Test Fixtures

Drop pixelation test images here.

Expected files (referenced by mock entities in
`src/app/[locale]/(app)/projects/[projectId]/entities/[entityId]/page.tsx`):

- `spryte-sentinel.png` — full fairy with elaborate pixel-block wings
- `spryte-scout.png` — minimal fairy with outline-only wings

These are served at `/test-fixtures/<file>` and used as the single layer
image for entity IDs `ent-pixel-test-1` / `ent-pixel-test-2`.

When real Storage is wired, this directory becomes redundant and should be
removed.
