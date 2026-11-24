// Run: node --test tools/open-hash.test.mjs
// Loads parseOpenHash from the marked block in index.html, so the page stays one file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const block = html.match(/\/\* open-hash:start \*\/([\s\S]*?)\/\* open-hash:end \*\//);
assert.ok(block, "index.html has no open-hash block");
const parseOpenHash = new Function(block[1] + "; return parseOpenHash;")();

test("a full hash", () => {
  assert.deepEqual(parseOpenHash("#file=materials%2Fmacro%2Fa-b.pdf&name=A%20B&page=19&back=index.html"),
    { file: "materials/macro/a-b.pdf", id: "f_materials_macro_a_b_pdf", name: "A B", page: 19, back: "index.html" });
});

test("defaults", () => {
  const o = parseOpenHash("#file=materials/macro/a-b.pdf");
  assert.equal(o.name, "a-b");
  assert.equal(o.page, null);
  assert.equal(o.back, null);
});

test("a bad page or back is dropped, the file still opens", () => {
  for (const p of ["0", "x", "-3", "1.5"]) assert.equal(parseOpenHash("#file=a.pdf&page=" + p).page, null);
  for (const b of ["https://x.com/a.html", "//x.com/a.html", "../a.html", "/a.html", "a.pdf", "javascript:alert(1)"])
    assert.equal(parseOpenHash("#file=a.pdf&back=" + encodeURIComponent(b)).back, null);
  assert.equal(parseOpenHash("#file=a.pdf&back=index.html%23back").back, "index.html#back");
});

test("a file outside the page's own folder is refused", () => {
  for (const f of ["https://x.com/a.pdf", "//x.com/a.pdf", "../a.pdf", "a/../../b.pdf", "/a.pdf", "a.txt", "a b.pdf", ""])
    assert.equal(parseOpenHash("#file=" + encodeURIComponent(f)), null, f);
  assert.equal(parseOpenHash(""), null);
  assert.equal(parseOpenHash("#python-check"), null);
});
