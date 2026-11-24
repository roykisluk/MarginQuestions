# Margin Questions

A PDF reader with Claude beside it. You draw a box around an equation, a table or a paragraph, ask a question, and
the answer is pinned in the margin next to the box. Notes are saved with the paper, an answer can draw a plot with
Python, and you can export the PDF with your notes written into its margins. It reopens where you stopped reading.

It is a page on claude.ai, and you run your own copy of it on your own account. Its sibling is Model Builder (a
skill and page that tutor you through building an economic model), and both come from the same author as
ResearchRoom (a dashboard for an empirical research project).

## Why it needs Claude

The page is a claude.ai artifact and runs only there. Asking the model, saving papers and notes, and storing the
PDFs are services that claude.ai gives the page; there is no server of its own and no version that runs elsewhere.

## What you need

- A claude.ai account, and Claude Code with artifact publishing (the `Artifact` tool).
- Python 3, to rebuild the packed files. Standard library only.

## Publish your own copy

1. Clone this repository and rebuild the packed files:
   ```
   git clone <this repository's URL> MarginQuestions
   cd MarginQuestions
   python3 tools/pack.py
   ```
   It downloads Pyodide 0.26.4 (about 60 MB) and writes `py/` and `fonts/note-font.json`. It ends with one `ok` line
   per file and exits with an error if any file differs from the copy that was tested (`tools/expected.sha256`).
2. In Claude Code, from this folder, ask:

   > Publish Margin Questions as a new artifact. The page is `index.html`; its capabilities are in
   > `capabilities.json`. Its supporting files, each at the same path: `py/worker.js`, `py/pyodide.js`,
   > `py/pyodide.asm.js`, `py/pyodide.asm.wasm`, `py/pyodide-lock.json`, every file in `py/data/`,
   > `fonts/note-font.json` and `fonts/LICENSE-DejaVu.txt`; and `NOTICE` published as
   > `NOTICE.txt`. One publish carries at most 64 MB and this is about 65 MB, so leave out the four files in
   > `py/data/` whose names start with `numpy-` or `matplotlib-3` and send them in a second publish to the same URL.

3. Open the link it gives you. Your copy starts empty.

Your papers, notes and margin answers are stored in your copy only. Its storage rules let only you, and anyone you
make an editor, read or write them. Sharing the link with a viewer shows them an empty page that cannot save.

## Updating

`git pull`, run `python3 tools/pack.py` again, and republish `index.html` (and any changed file) to the same URL.

## Edit mode

For a document you are writing (slides, a draft), not one you are reading. Switch on **Edit mode** in the header, draw
a box over what should change and type the change ("cut this to one line"). The box is saved in orange and nothing is
asked: the page calls no model. Then ask Claude Code, in the folder that holds the document's source, to apply your
Margin Questions edits on that PDF. A box you add to later opens again.

What Claude Code reads and writes, with the `ArtifactData` tool on your copy's URL:

1. In `papers`, the paper whose `name` is the PDF's file name; keep its `id`.
2. In `notes`, the documents with that `paperId`, `kind` `"edit"` and `done` not `true`. Each has `page` (from 1),
   `rect` (`x`, `y`, `w`, `h` as fractions of the page, from its top left) and `messages`, where every `user` message
   is part of the request.
3. It finds the text under each box in the PDF, finds the matching place in the source and makes the change.
4. It writes back to each note it applied: appends `{"role": "assistant", "content": "<what changed>", "model":
   "Claude Code"}` to `messages` and sets `done` to `true`, pinned to the version it read. The page shows the box dimmed
   and the reply in its card after a reload.

Rebuilding the document changes the PDF, so open the new build as a new paper for the next round of edits.

## Inside another artifact

The page can be the PDF reader of another claude.ai artifact of yours. Publish `index.html` there under another name
(say `reader.html`) with the files from step 2 above, add this page's capabilities to that artifact's own, and send the
viewer to it from the main page:

```
location.assign("reader.html#" + new URLSearchParams({ file: "papers/smith-2020.pdf", name: "Smith (2020)", page: 12, back: "index.html" }))
```

- `file`: a PDF published beside the page. It must be a relative path of letters, digits, `.`, `_`, `-` and `/`.
- `name` (optional): the title shown for it. `page` (optional): open at this page instead of where you stopped.
- `back` (optional): a page of the same artifact; a Back button leads to it.

The PDF is saved in the paper list like an uploaded one, so its notes and margin answers come back the next time.
They are stored in the artifact that holds the page.

## Limits

- Every test ran on one account, the author's. Nothing yet shows that it works on another account.
- The builder of this repository could not click through a copy on claude.ai: no browser it had was signed in. What
  was checked: a copy published by the steps above holds the right files, capabilities and empty storage, and the
  page's libraries load in a browser outside claude.ai. Not clicked through by the builder: opening a PDF, asking
  about a boxed passage, an answer that draws a plot, saving and reopening, and exporting the PDF with notes. The
  page's code is the author's own copy, which is in daily use, except that it loads pdf-lib and fontkit from
  jsDelivr instead of from bundled files.

## Licence

MIT for the page and the script (`LICENSE`). The bundled and rebuilt parts keep their own licences: see `NOTICE`.
