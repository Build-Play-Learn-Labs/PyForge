"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false }
);

export default function EditorPage() {
  const initial = useMemo(
    () =>
      [
        "def greet(name: str) -> str:",
        "    return f'Hello, {name}!'",
        "",
        "if __name__ == '__main__':",
        "    print(greet('PyForge'))",
        "",
      ].join("\n"),
    []
  );

  const [value, setValue] = useState<string>(initial);
  const [output, setOutput] = useState<string>("");
  const [pyReady, setPyReady] = useState(false);
  const pyodideRef = useRef<any>(null);
  const stdinRef = useRef<HTMLTextAreaElement>(null);

  const appendOut = (s: string) => {
    setOutput((prev) => (prev ? prev + "\n" + s : s));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const base = "/pyodide/";
        appendOut("Loading Pyodide core…");
        const src = new URL("/pyodide/pyodide.mjs", window.location.origin).toString();
        const { loadPyodide } = await import(/* webpackIgnore: true */ src);
        const py = await loadPyodide({
          indexURL: base,
          stdout: (s: string) => appendOut(s),
          stderr: (s: string) => appendOut(s),
        });
        if (cancelled) return;
        pyodideRef.current = py;
        setPyReady(true);
        appendOut("Pyodide ready.");
      } catch (e) {
        appendOut("Failed to load Pyodide: " + String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runCode = async () => {
    setOutput("");
    const py = pyodideRef.current;
    if (!py) {
      appendOut("Pyodide not ready yet…");
      return;
    }
    try {
      const raw = stdinRef.current?.value ?? "";
      const lines = raw.length ? raw.split(/\r?\n/) : [];
      const pyList = py.toPy ? py.toPy(lines) : lines;
      py.globals.set("STDIN_LINES", pyList);
      await py.runPythonAsync(
        [
          "import builtins",
          "def __js_next_input(prompt=\"\"):",
          "    print(prompt, end=\"\")",
          "    try:",
          "        return STDIN_LINES.pop(0)",
          "    except Exception:",
          "        raise EOFError(\"No more input\")",
          "builtins.input = __js_next_input",
        ].join("\n")
      );
      await py.runPythonAsync(value);
    } catch (e) {
      appendOut(String(e));
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-zinc-100">
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <h1 className="text-sm font-medium text-zinc-300">/editor</h1>
        <nav className="flex items-center gap-3 text-sm text-zinc-400">
          <button
            disabled={!pyReady}
            className="rounded bg-emerald-600 disabled:bg-emerald-900/50 px-3 py-1.5 text-white hover:bg-emerald-500"
            onClick={runCode}
          >
            {pyReady ? "Run" : "Loading Pyodide…"}
          </button>
          <Link href="/" className="hover:text-zinc-200">
            Home
          </Link>
        </nav>
      </header>

      <div className="h-[calc(100vh-3.25rem)] w-full flex">
        <div className="flex-1">
          <MonacoEditor
            height="100%"
            language="python"
            theme="vs-dark"
            value={value}
            onChange={(v) => setValue(v ?? "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              smoothScrolling: true,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              insertSpaces: true,
            }}
          />
        </div>
        <div className="w-[36%] min-w-[280px] max-w-[600px] border-l border-white/10 flex flex-col bg-black/40">
          <div className="px-4 py-2 text-xs uppercase tracking-wide text-zinc-400">Stdin</div>
          <div className="px-4 pb-3">
            <textarea
              ref={stdinRef}
              placeholder="Each line is returned by input()."
              className="w-full h-28 resize-y rounded bg-zinc-900/60 border border-white/10 text-zinc-100 p-2 font-mono text-sm outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="px-4 py-2 text-xs uppercase tracking-wide text-zinc-400 border-t border-white/10">Output</div>
          <div className="px-4 py-3 font-mono text-sm bg-zinc-900/60 overflow-auto flex-1">
            {output || "Output will appear here."}
          </div>
        </div>
      </div>
    </div>
  );
}
