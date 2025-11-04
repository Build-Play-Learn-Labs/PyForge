Local Pyodide assets

Place the contents of the Pyodide distribution here so the app can load
Pyodide without using a CDN.

Tested version: v0.29.0 (full)

How to populate:
- Download the archive for v0.24.1 (full build) from the official releases.
  For example, grab pyodide-0.24.1.zip and extract the `pyodide` folder.
- Copy all extracted files into this folder so that these files exist:
  - /pyodide/pyodide.js
  - /pyodide/pyodide.wasm
  - /pyodide/pyodide_py.tar
  - plus other required .data/.json files

In code, we load via:

  indexURL: "/pyodide/"

Next.js serves `client/public` at the site root, so `/pyodide/pyodide.js`
should resolve when running `next dev` or `next start`.

If you use a different version, update `indexURL` and ensure all files
match that version.
