# Margin Questions — rules for agents

What this is: a claude.ai artifact page (`index.html`, with `py/worker.js` running Python in a web worker), its publish
steps (`README.md`), and `tools/pack.py`, which rebuilds the packed files the page needs.

## Rules

- This repository is public. Nothing personal goes into a file or a commit message: no names, e-mail addresses, home
  paths, private repositories or machines, artifact links of anyone's own copy, or anyone's papers and notes.
  `tools/clean-check.sh` checks files and history against a deny-list kept outside the repository; `tools/pre-push`
  runs it (install: `ln -s ../../tools/pre-push .git/hooks/pre-push`). `tools/clean-check.sh` is a copy of
  ResearchRoom's; change it there first.
- No base64 in git. The packed files (`py/pyodide*`, `py/data/`, `fonts/note-font.json`) are build output: the
  host serves neither `.whl` nor `.zip`, so `pack.py` writes them as base64 text in JSON strings, and base64 matches
  deny-list patterns by chance.
- `tools/expected.sha256` holds the hashes of a published copy that was tested. `pack.py` fails if its output
  differs. To move to a new Pyodide: change `PYODIDE` and `PACKED` (matplotlib's dependencies in the new lock), run
  `pack.py`, publish a copy, test it on claude.ai, and only then replace `expected.sha256` with its hashes and note
  it below.
- The page runs only on claude.ai. A version for anywhere else is a separate design.
- `capabilities.json` is the declaration a copy is published with. Changing a storage rule changes who can read
  people's notes: say so in the commit message.

## Lesson log

Newest at the bottom. Each entry: symptom → root cause → fix.

- 2026-11-13. Symptom: the clean-check failed on the vendored `lib/pdf-lib.min.js` and `lib/fontkit.umd.min.js`.
  Root cause: a deny-list line matches part of "horizontal". Fix: an allow-list line for `[Hh]orizontal` beside the
  deny-list (outside the repository); no deny-list line was removed. Superseded by the next entry.
- 2026-11-13. Symptom: publishing a copy failed: "supporting file lib/fontkit.umd.min.js carries an ESC byte". Root
  cause: claude.ai refuses text files with raw control bytes; fontkit has 114 inside JS strings, pdf-lib one. The
  author's own copy was published before that check existed. Fix: the page loads both from jsDelivr at exact
  versions (pdf-lib 1.17.1, @pdf-lib/fontkit 1.1.1, byte-identical to the files it used), and `lib/` left the
  repository. Before publishing any other text file, check it for bytes 0x00-0x1F other than tab and newlines.
- 2026-11-13. Symptom: a full copy is 66.7 MB, over the 64 MB a single publish carries. Root cause: the host's
  per-publish limit. Fix: the README publishes in two steps to one URL, the numpy and matplotlib parts second.
- 2026-11-13. Every packed file is byte-identical to an upstream file: Pyodide 0.26.4 from jsDelivr, encoded as
  `json.dumps` of one-line standard base64, cut every 14,680,064 characters into `<name>.<i>.json`; the manifest is
  `json.dumps(..., indent=0, sort_keys=True)`; the font is `DejaVuSansCondensed.ttf` from DejaVu 2.37.
- 2026-11-13. Symptom: the history check flagged the `CLAUDE.md` import line as an e-mail address. Root cause: in a
  diff the line starts with a plus sign, which is a valid local part right before `@AGENTS.md`. Fix: `CLAUDE.md` puts
  a word before the import (`See @AGENTS.md`); never write the plus sign and the import side by side.
