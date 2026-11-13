/* Python worker for Margin Questions: runs matplotlib code and returns a PNG. */
const step = (msg) => postMessage({ type: "progress", msg });
const BASE = new URL("./", self.location.href).href;

/* The artifact host can't serve .zip/.whl files, so the Python standard library and the
   packages are stored as base64 text in data/*.json. Python's loader asks for them with
   fetch(); this answers those requests from the packed copies. */
const realFetch = self.fetch.bind(self);
let manifestP = null;
async function packed(name) {
  manifestP = manifestP || realFetch(BASE + "data/manifest.json").then((r) => { if (!r.ok) throw new Error("manifest " + r.status); return r.json(); });
  const parts = (await manifestP)[name];
  if (!parts) return null;
  const strs = await Promise.all(parts.map((p) => realFetch(BASE + "data/" + encodeURIComponent(p)).then((r) => {
    if (!r.ok) throw new Error(p + " " + r.status); return r.json();
  })));
  const bin = atob(strs.join(""));
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
self.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : (input && input.url) || String(input);
  const name = decodeURIComponent(new URL(url, BASE).pathname.split("/").pop());
  let bytes = null;
  try { bytes = await packed(name); } catch (e) { step("data problem: " + (e && e.message || e)); throw e; }
  if (bytes) return new Response(bytes, { status: 200, headers: { "Content-Type": "application/octet-stream" } });
  return realFetch(input, init);
};
try { step("loading the Python runtime"); importScripts(BASE + "pyodide.js"); }
catch (e) { postMessage({ type: "loadError", error: "could not load pyodide.js (" + String(e && e.message || e) + ")" }); throw e; }
let py = null;
const WRAP = [
  "import matplotlib",
  "matplotlib.use('Agg')",
  "import matplotlib.pyplot as plt, io, base64",
  "plt.close('all')",
  "plt.rcdefaults()",
  "plt.rcParams.update({'figure.figsize': (6.4, 3.8), 'figure.dpi': 100, 'axes.spines.top': False, 'axes.spines.right': False, 'axes.grid': True, 'grid.alpha': 0.25, 'font.size': 10.5, 'axes.prop_cycle': matplotlib.cycler(color=['#2a52be', '#d9822b', '#2e8b57', '#b03a6e', '#6b6b6b'])})",
  "import numpy as np",
  "__ns = {'__name__': '__main__', 'plt': plt, 'np': np, 'matplotlib': matplotlib}",
  "exec(compile(__user_code, '<plot>', 'exec'), __ns)",
  "__nums = plt.get_fignums()",
  "if not __nums: raise RuntimeError('The code ran but made no matplotlib figure.')",
  "__buf = io.BytesIO()",
  "plt.figure(__nums[-1]).savefig(__buf, format='png', dpi=160, bbox_inches='tight', facecolor='white')",
  "plt.close('all')",
  "base64.b64encode(__buf.getvalue()).decode()",
].join("\n");
const ready = (async () => {
  step("starting Python");
  py = await loadPyodide({ indexURL: BASE });
  step("loading numpy and matplotlib");
  await py.loadPackage(["numpy", "matplotlib"], { messageCallback: () => {}, errorCallback: (m) => step("package problem: " + m) });
})();
ready.then(() => postMessage({ type: "ready" }), (e) => postMessage({ type: "loadError", error: String(e && e.message || e) }));
onmessage = async (e) => {
  const { id, code } = e.data;
  let out = "";
  try {
    await ready;
    py.setStdout({ batched: (s) => { out += s + "\n"; } });
    py.setStderr({ batched: (s) => { out += s + "\n"; } });
    try { await py.loadPackagesFromImports(code); } catch (err) { /* only numpy and matplotlib are hosted */ }
    py.globals.set("__user_code", code);
    const png = await py.runPythonAsync(WRAP);
    postMessage({ id, ok: true, png, out });
  } catch (err) {
    postMessage({ id, ok: false, error: String(err && err.message || err), out });
  }
};
