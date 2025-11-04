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
  const [isExecuting, setIsExecuting] = useState(false);
  const [terminalLine, setTerminalLine] = useState<string>("");
  const [awaitingPrompt, setAwaitingPrompt] = useState<string | null>(null);
  const pyodideRef = useRef<any>(null);
  const terminalOutputRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const pendingInputResolverRef = useRef<null | ((s: string) => void)>(null);

  const appendOut = (s: string) => {
    setOutput((prev) => (prev ? prev + "\n" + s : s));
    setTimeout(() => {
      if (terminalOutputRef.current) {
        terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
      }
    }, 0);
  };

  const clearOutput = () => {
    setOutput("");
    setTerminalLine("");
    setAwaitingPrompt(null);
    pendingInputResolverRef.current = null;
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
        appendOut("Loading micropip…");
        await py.loadPackage("micropip");
        await py.runPythonAsync(`
import ast
import asyncio

class PyForgeAsyncTransformer(ast.NodeTransformer):
    def visit_Call(self, node):
        if isinstance(node.func, ast.Name) and node.func.id == 'input':
            return ast.Await(value=self.generic_visit(node))
        return self.generic_visit(node)

def transform_code(code):
    try:
        tree = ast.parse(code)
        transformer = PyForgeAsyncTransformer()
        new_tree = transformer.visit(tree)
        ast.fix_missing_locations(new_tree)

        wrapper = ast.AsyncFunctionDef(
            name='__pyforge_main__',
            args=ast.arguments(posonlyargs=[], args=[], kwonlyargs=[], kw_defaults=[], defaults=[]),
            body=new_tree.body,
            decorator_list=[]
        )

        module = ast.Module(
            body=[
                ast.Import(names=[ast.alias(name='asyncio')]),
                wrapper,
                ast.Expr(
                    value=ast.Await(
                        value=ast.Call(func=ast.Name(id='__pyforge_main__', ctx=ast.Load()), args=[], keywords=[])
                    )
                )
            ],
            type_ignores=[]
        )
        ast.fix_missing_locations(module)
        return ast.unparse(module)
    except Exception as exc:
        return f"print('TRANSFORMER_ERROR:', {exc!r})"
`);
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
    if (isExecuting) return;
    setOutput("");
    setAwaitingPrompt(null);
    pendingInputResolverRef.current = null;
    const py = pyodideRef.current;
    if (!py) {
      appendOut("Pyodide not ready yet…");
      return;
    }
    setIsExecuting(true);
    appendOut("$ python main.py");
    try {
      py.globals.set("JS_INPUT", (prompt?: any) => {
        const text = typeof prompt === "string" ? prompt : String(prompt ?? "");
        setAwaitingPrompt(text);
        if (text?.length) {
          appendOut(text);
        }
        return new Promise<string>((resolve) => {
          pendingInputResolverRef.current = resolve;
          setTimeout(() => terminalInputRef.current?.focus(), 0);
        });
      });
      await py.runPythonAsync([
        "import builtins",
        "builtins.input = JS_INPUT",
      ].join("\n"));
      const transformCode = py.globals.get("transform_code");
      const transformedCode = transformCode(value).toString();
      transformCode.destroy?.();
      await py.runPythonAsync(transformedCode);
    } catch (e) {
      appendOut(String(e));
    } finally {
      setIsExecuting(false);
      setAwaitingPrompt(null);
      pendingInputResolverRef.current = null;
      setTerminalLine("");
    }
  };

  const submitTerminalLine = () => {
    const resolver = pendingInputResolverRef.current;
    if (!resolver) return;
    const line = terminalLine;
    setTerminalLine("");
    appendOut(line ? `› ${line}` : "›");
    pendingInputResolverRef.current = null;
    setAwaitingPrompt(null);
    resolver(line);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-slate-950 via-zinc-950 to-black text-zinc-100">
      <header className="relative flex items-center justify-between border-b border-emerald-500/20 bg-gradient-to-r from-black/80 via-emerald-950/10 to-black/80 px-8 py-4 shadow-lg shadow-emerald-500/5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
            <svg className="h-6 w-6 text-emerald-950" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-zinc-50">PyForge</h1>
            <p className="text-xs font-medium text-emerald-400/80">Browser-based Python IDE</p>
          </div>
        </div>
        <nav className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-950/30 px-4 py-2 shadow-inner">
            <div className={`h-2.5 w-2.5 rounded-full shadow-lg ${pyReady ? "bg-emerald-400 shadow-emerald-400/50" : "bg-amber-400 shadow-amber-400/50 animate-pulse"}`}/>
            <span className="text-xs font-semibold text-zinc-200">{pyReady ? "Ready" : "Initializing"}</span>
          </div>
          <button
            disabled={!pyReady || isExecuting}
            className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2 font-bold text-emerald-950 shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-105 hover:shadow-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            onClick={runCode}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"/>
            <span className="relative flex items-center gap-2">
              {isExecuting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Executing
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Run
                </>
              )}
            </span>
          </button>
          <button
            className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-2 font-semibold text-zinc-300 transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-800/50"
            onClick={clearOutput}
          >
            Clear
          </button>
          <Link
            href="/"
            className="rounded-lg border border-transparent px-4 py-2 font-semibold text-zinc-400 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/30 hover:text-zinc-200"
          >
            Home
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 gap-1 overflow-hidden bg-zinc-950 p-1">
        <section className="group relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/90 to-black shadow-2xl transition-all duration-300 hover:border-emerald-500/30">
          <div className="flex items-center justify-between border-b border-zinc-800/50 bg-gradient-to-r from-zinc-900/50 to-zinc-900/30 px-5 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80 shadow-inner"/>
                <div className="h-3 w-3 rounded-full bg-yellow-500/80 shadow-inner"/>
                <div className="h-3 w-3 rounded-full bg-green-500/80 shadow-inner"/>
              </div>
              <span className="ml-2 font-mono text-xs font-medium text-zinc-400">main.py</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="rounded bg-zinc-800/60 px-2 py-0.5 font-mono">Python 3.11</span>
              <span className="text-emerald-400/60">●</span>
              <span>Monaco Editor</span>
            </div>
          </div>
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language="python"
              theme="vs-dark"
              value={value}
              onChange={(v) => setValue(v ?? "")}
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true,
                wordWrap: "on",
                smoothScrolling: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                lineNumbersMinChars: 3,
                padding: { top: 16, bottom: 16 },
                renderLineHighlight: "all",
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>
        </section>

        <aside className="flex w-full flex-col overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-950 via-black to-zinc-950 shadow-[0_30px_80px_-30px_rgba(16,185,129,0.45)] lg:w-[38%] lg:max-w-[600px]">
          <div className="flex items-center justify-between border-b border-emerald-500/15 bg-black/50 px-6 py-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.35em] text-emerald-200">Terminal</span>
              <span className="text-xs text-zinc-500">Streamed stdout & stdin</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className={`flex h-2 w-2 rounded-full ${pendingInputResolverRef.current ? "bg-amber-400" : pyReady ? "bg-emerald-400" : "bg-amber-500 animate-pulse"}`} />
              <span>{pendingInputResolverRef.current ? "Awaiting input" : pyReady ? "Idle" : "Booting"}</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            <div
              ref={terminalOutputRef}
              className="flex-1 overflow-y-auto bg-zinc-950 px-6 py-4 font-mono text-sm leading-7 text-emerald-100 shadow-inner scrollbar-thin scrollbar-track-transparent scrollbar-thumb-emerald-900/60"
            >
              {output ? (
                <pre className="whitespace-pre-wrap break-words text-emerald-100/95">{output}</pre>
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-600">
                  <div className="text-center">
                    <svg className="mx-auto mb-4 h-14 w-14 text-emerald-500/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <p className="text-sm font-medium text-zinc-400">Terminal ready</p>
                    <p className="mt-1 text-xs text-zinc-600">Run your script to interact here in real time.</p>
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitTerminalLine();
              }}
              className="border-t border-emerald-500/15 bg-black/70 px-6 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 font-mono text-sm text-emerald-300">$</div>
                <input
                  ref={terminalInputRef}
                  value={terminalLine}
                  onChange={(e) => setTerminalLine(e.target.value)}
                  placeholder={pendingInputResolverRef.current ? "Type and press Enter" : pyReady ? "Click Run to execute" : "Initializing runtime"}
                  disabled={!pendingInputResolverRef.current}
                  className="flex-1 rounded-lg border border-emerald-500/25 bg-zinc-950/80 px-4 py-2 font-mono text-sm text-emerald-50 outline-none transition-all duration-200 placeholder:text-emerald-500/50 focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitTerminalLine();
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!pendingInputResolverRef.current}
                  className="rounded-lg border border-emerald-500/30 bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-emerald-500/40 transition-all hover:-translate-y-[1px] hover:shadow-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  Enter
                </button>
              </div>
            </form>
          </div>
        </aside>
      </main>
    </div>
  );
}
