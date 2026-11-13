#!/usr/bin/env python3
"""Rebuild the page's packed files: the Python runtime under py/ and the note font as fonts/note-font.json.

The artifact host serves neither .whl nor .zip files, so each one is published as base64 text in one or two JSON string
files, and py/worker.js reassembles them. Run from anywhere: python3 tools/pack.py
It downloads Pyodide from jsDelivr, writes the files (all git-ignored), and checks every one against
tools/expected.sha256, the files of the published copy that was tested. Exit 1 on any mismatch. Standard library only.
"""
import base64, hashlib, json, pathlib, sys, urllib.request

PYODIDE = "0.26.4"
CDN = f"https://cdn.jsdelivr.net/pyodide/v{PYODIDE}/full/"
PART = 14 * 1024 * 1024  # base64 characters per part file; keeps each file under the host's 16 MB text limit
CORE = ["pyodide.js", "pyodide.asm.js", "pyodide.asm.wasm", "pyodide-lock.json"]
PACKED = [  # matplotlib and everything it needs, plus the standard library
    "python_stdlib.zip",
    "cycler-0.12.1-py3-none-any.whl",
    "fonttools-4.51.0-py3-none-any.whl",
    "kiwisolver-1.4.5-cp312-cp312-pyodide_2024_0_wasm32.whl",
    "matplotlib-3.5.2-cp312-cp312-pyodide_2024_0_wasm32.whl",
    "matplotlib_pyodide-0.2.2-py3-none-any.whl",
    "numpy-1.26.4-cp312-cp312-pyodide_2024_0_wasm32.whl",
    "packaging-23.2-py3-none-any.whl",
    "pillow-10.2.0-cp312-cp312-pyodide_2024_0_wasm32.whl",
    "pyparsing-3.1.2-py3-none-any.whl",
    "python_dateutil-2.9.0.post0-py2.py3-none-any.whl",
    "pytz-2024.1-py2.py3-none-any.whl",
    "six-1.16.0-py2.py3-none-any.whl",
]
ROOT = pathlib.Path(__file__).resolve().parent.parent


def get(name):
    print("downloading", name, flush=True)
    with urllib.request.urlopen(CDN + name) as r:
        return r.read()


def as_json_string(data):
    return base64.b64encode(data).decode("ascii")


def main():
    (ROOT / "py" / "data").mkdir(parents=True, exist_ok=True)
    for name in CORE:
        (ROOT / "py" / name).write_bytes(get(name))
    manifest = {}
    for name in PACKED:
        b64, stem = as_json_string(get(name)), name.rsplit(".", 1)[0]
        manifest[name] = [f"{stem}.{i}.json" for i in range(-(-len(b64) // PART))]
        for i, part in enumerate(manifest[name]):
            (ROOT / "py" / "data" / part).write_text(json.dumps(b64[i * PART:(i + 1) * PART]))
    (ROOT / "py" / "data" / "manifest.json").write_text(json.dumps(manifest, indent=0, sort_keys=True))
    font = (ROOT / "fonts" / "DejaVuSansCondensed.ttf").read_bytes()
    (ROOT / "fonts" / "note-font.json").write_text(json.dumps(as_json_string(font)))

    bad = 0
    for line in (ROOT / "tools" / "expected.sha256").read_text().splitlines():
        want, path = line.split(maxsplit=1)
        p = ROOT / path
        ok = p.exists() and hashlib.sha256(p.read_bytes()).hexdigest() == want
        bad += not ok
        print("ok      " if ok else "MISMATCH", path)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
