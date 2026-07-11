import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeRow, entryMarker, monthFileFor } from "../scripts/drain-inbox.mjs";

const row = (over = {}) => ({
  id: "11111111-1111-1111-1111-111111111111",
  created_at: "2026-07-10T18:30:00.000Z",
  person: "me",
  kind: "journal",
  payload: { text: "Legs felt springy on the intervals." },
  ...over,
});

test("merging into an empty month creates title, date heading, and marked entry", () => {
  const { content, added } = mergeRow("", row());
  assert.equal(added, true);
  assert.match(content, /^# Journal — July 2026/);
  assert.match(content, /## 2026-07-10/);
  assert.ok(content.includes(entryMarker(row().id)));
  assert.ok(content.includes("Legs felt springy"));
});

test("drain is idempotent — merging the same row twice changes nothing", () => {
  const first = mergeRow("", row());
  const second = mergeRow(first.content, row());
  assert.equal(second.added, false);
  assert.equal(second.content, first.content);
  const occurrences = second.content.split(entryMarker(row().id)).length - 1;
  assert.equal(occurrences, 1);
});

test("two rows on the same day share one date heading", () => {
  const a = mergeRow("", row());
  const b = mergeRow(a.content, row({ id: "22222222-2222-2222-2222-222222222222", payload: { text: "Evening: slept badly, noting it." } }));
  assert.equal(b.added, true);
  const headings = b.content.split("## 2026-07-10").length - 1;
  assert.equal(headings, 1);
  assert.ok(b.content.includes("Evening: slept badly"));
  assert.ok(b.content.includes("Legs felt springy"));
});

test("a new date heading lands above older content (newest first)", () => {
  const older = mergeRow("", row({ id: "33333333-3333-3333-3333-333333333333", created_at: "2026-07-08T10:00:00.000Z", payload: { text: "old entry" } }));
  const newer = mergeRow(older.content, row());
  const posNew = newer.content.indexOf("## 2026-07-10");
  const posOld = newer.content.indexOf("## 2026-07-08");
  assert.ok(posNew !== -1 && posOld !== -1 && posNew < posOld);
});

test("non-journal kinds are tagged and non-text payloads survive", () => {
  const { content } = mergeRow("", row({ kind: "coach-note", payload: { text: "Ease up this week." } }));
  assert.ok(content.includes("coach-note"));
  const meal = mergeRow("", row({ id: "55555555-5555-5555-5555-555555555555", kind: "meal", payload: { text: "2 rotis + dal, late lunch" } }));
  assert.ok(meal.content.includes("meal"));
  assert.ok(meal.content.includes("2 rotis + dal"));
  const j = mergeRow("", row({ id: "44444444-4444-4444-4444-444444444444", payload: { structured: true, rpe: 8 } }));
  assert.ok(j.content.includes('"rpe":8'));
});

test("rows route to the right person's entries directory", () => {
  assert.match(monthFileFor(row(), "/repo").replaceAll("\\", "/"), /\/repo\/journal\/entries\/2026-07\.md$/);
  assert.match(
    monthFileFor(row({ person: "sam" }), "/repo").replaceAll("\\", "/"),
    /\/repo\/journal\/people\/sam\/entries\/2026-07\.md$/
  );
});
