import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-950 via-black to-zinc-900 text-zinc-100">

      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium tracking-wide text-zinc-300">PyForge</span>
        </div>
        <nav className="flex items-center gap-4 text-sm text-zinc-400">
          <Link href="/editor" className="rounded bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-500">
            Open Editor
          </Link>
          <a
            href="https://github.com/Build-Play-Learn-Labs/PyForge"
            target="_blank"
            rel="noreferrer"
            className="rounded border border-white/10 px-3 py-1.5 text-zinc-300 hover:border-white/20 hover:text-zinc-100"
          >
            GitHub
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <section>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-50">
              Code Python in your browser
            </h1>
            <p className="mt-4 text-zinc-400 leading-relaxed">
              PyForge pairs the Monaco Editor with a local Pyodide runtime so you can
              edit and run Python instantly — no backend required.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/editor"
                className="rounded bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Try the Editor
              </Link>
              <a
                href="/editor"
                className="rounded border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:border-white/20"
              >
                Quick Start
              </a>
            </div>
            <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-zinc-300">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Monaco Editor (VS Code grade)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Run with Pyodide locally
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Stdin and output panel
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> No servers, no setup
              </li>
            </ul>
          </section>

          <section className="rounded-lg border border-white/10 bg-zinc-950/60 backdrop-blur p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="ml-2">example.py</span>
            </div>
            <pre className="max-h-[340px] overflow-auto rounded-md bg-black/40 p-4 text-sm leading-6 text-zinc-200">
{`def greet(name: str) -> str:
    return f"Hello, {name}!"

name = input("Your name: ")
print(greet(name))`}
            </pre>
          </section>
        </div>
      </main>

      <footer className="px-6 py-6 border-t border-white/10 text-xs text-zinc-500">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <span>© {new Date().getFullYear()} PyForge</span>
          <span className="text-zinc-600">Monaco + Pyodide demo</span>
        </div>
      </footer>
    </div>
  );
}
