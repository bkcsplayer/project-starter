export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
      <header className="mx-auto max-w-6xl px-6 py-10 flex items-center justify-between">
        <div className="font-semibold tracking-tight text-xl">project-starter</div>
        <nav className="text-sm flex gap-4">
          <a className="hover:underline" href="/admin/">Admin</a>
          <a className="hover:underline" href="/api/hello" target="_blank">API</a>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <section className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight">Ship prototypes faster</h1>
          <p className="mt-3 text-slate-600">
            React (Vite + Tailwind) + React-Admin + PostgreSQL + Docker, with Node/Go/Python API starters.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a className="rounded-lg bg-slate-900 px-4 py-2 text-white" href="/admin/">Open Admin</a>
            <a className="rounded-lg border px-4 py-2" href="/api/hello" target="_blank">Test API</a>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card title="One repo, one project" desc="Repeatable structure for every project." />
            <Card title="Docker-first" desc="Same setup locally, on VPS, anywhere." />
            <Card title="Reasoning-ready" desc="OpenRouter wrapper fetches /models first and uses reasoning mode." />
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="font-semibold">Quick links</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><code className="rounded bg-slate-100 px-2 py-1">/admin/</code> React-Admin panel</li>
              <li><code className="rounded bg-slate-100 px-2 py-1">/api/hello</code> API hello</li>
              <li><code className="rounded bg-slate-100 px-2 py-1">/api/ai/reason</code> Reasoning example (Node/Py)</li>
            </ul>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="font-semibold">Run with Docker</h2>
            <pre className="mt-3 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100"><code>{`cp .env.example .env
docker compose up -d --build
# Go: docker compose -f compose.yaml -f compose.go.yaml up -d --build
# Py: docker compose -f compose.yaml -f compose.py.yaml up -d --build`}</code></pre>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-500">
          Built for rapid iteration. Customize freely.
        </div>
      </footer>
    </div>
  );
}

function Card(props: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border p-5">
      <div className="font-semibold">{props.title}</div>
      <div className="mt-1 text-sm text-slate-600">{props.desc}</div>
    </div>
  );
}
