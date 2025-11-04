import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-black to-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(45,212,191,0.18)_1px,_transparent_1px)] [background-size:36px_36px]" />
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="absolute top-1/3 right-[-80px] h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-[-80px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[140px]" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 text-lg font-bold text-emerald-950">
            PF
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200/80">
              PyForge
            </span>
            <span className="text-base font-semibold text-white">
              Play. Code. Create.
            </span>
          </div>
        </div>
        <nav>
          <Link
            href="/editor"
            className="rounded-full border border-emerald-500/60 bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition-transform hover:-translate-y-0.5"
          >
            Open Playground
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-6">
        <section className="rounded-3xl border border-white/20 bg-white/15 p-8 text-center text-white">
          <h2 className="text-3xl font-black">Ready to spark a coding adventure?</h2>
          <p className="mt-3 text-sm text-white/90">
            Pick a mission, invite a friend, and turn imagination into playful Python stories.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/editor"
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#FF4D8D] shadow-[0_15px_45px_RGBA(255,255,255,0.45)] transition hover:-translate-y-1"
            >
              Open the Playground
            </Link>
            <a
              href="mailto:team@pyforge.dev"
              className="rounded-full bg-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/30"
            >
              Talk to the Team
            </a>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-white/20 bg-white/10 py-6 text-[11px] uppercase tracking-[0.35em] text-white/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} PyForge Kids</span>
          <div className="flex items-center gap-4">
            <span>Play</span>
            <span>Create</span>
            <span>Share</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
