import { useState, useEffect } from "react";

interface HealthStatus {
  ok: boolean;
  ts?: string;
  error?: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [envStatus, setEnvStatus] = useState<{
    apiKeyConfigured: boolean;
    checking: boolean;
  }>({ apiKeyConfigured: false, checking: true });

  useEffect(() => {
    // Check API health
    fetch("/api/healthz")
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => setHealth({ ok: false, error: err.message }));

    // Check if OpenRouter key seems configured by trying the reason endpoint
    fetch("/api/ai/reason", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "test" }),
    })
      .then((res) => {
        setEnvStatus({
          apiKeyConfigured: res.status !== 400,
          checking: false,
        });
      })
      .catch(() => setEnvStatus({ apiKeyConfigured: false, checking: false }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-lg shadow-lg shadow-violet-500/25">
              PS
            </div>
            <span className="font-semibold text-xl tracking-tight">
              project-starter
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a
              href="/admin/"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Admin
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm text-slate-300 mb-6 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Full-Stack Starter Template
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Ship Prototypes
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text">
              10x Faster
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            React + Vite + TailwindCSS • React-Admin • PostgreSQL • Node/Go/Python APIs
            <br />
            Docker-first • OpenRouter reasoning-ready
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <a
              href="/admin/"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-105"
            >
              Open Admin Panel
            </a>
            <a
              href="/api/healthz"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 font-semibold hover:bg-white/20 transition-all"
            >
              Check API Health
            </a>
            <a
              href="/api/hello"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 font-semibold hover:bg-white/20 transition-all"
            >
              Test API
            </a>
          </div>
        </section>

        {/* Status Cards */}
        <section className="grid md:grid-cols-2 gap-6 mb-16">
          {/* API Health */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-3 h-3 rounded-full ${health?.ok ? "bg-emerald-400" : "bg-red-400"
                  } ${health === null ? "animate-pulse bg-yellow-400" : ""}`}
              ></div>
              <h2 className="font-semibold text-lg">API Status</h2>
            </div>
            {health === null ? (
              <p className="text-slate-400">Checking...</p>
            ) : health.ok ? (
              <p className="text-emerald-400">
                ✓ Connected • Last check: {new Date(health.ts!).toLocaleTimeString()}
              </p>
            ) : (
              <p className="text-red-400">✗ Connection failed: {health.error}</p>
            )}
          </div>

          {/* Environment Status */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-3 h-3 rounded-full ${envStatus.checking
                    ? "bg-yellow-400 animate-pulse"
                    : envStatus.apiKeyConfigured
                      ? "bg-emerald-400"
                      : "bg-amber-400"
                  }`}
              ></div>
              <h2 className="font-semibold text-lg">OpenRouter API Key</h2>
            </div>
            {envStatus.checking ? (
              <p className="text-slate-400">Checking configuration...</p>
            ) : envStatus.apiKeyConfigured ? (
              <p className="text-emerald-400">✓ Configured and ready</p>
            ) : (
              <p className="text-amber-400">
                ⚠ Not configured. Set <code className="bg-white/10 px-2 py-1 rounded">OPENROUTER_API_KEY</code> in .env
              </p>
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-6 mb-16">
          <FeatureCard
            icon="🚀"
            title="One Repo, One Project"
            desc="Repeatable structure for every prototype. Clone, customize, ship."
          />
          <FeatureCard
            icon="🐳"
            title="Docker-First"
            desc="Same setup locally, on VPS, anywhere. One command to launch."
          />
          <FeatureCard
            icon="🧠"
            title="Reasoning-Ready"
            desc="OpenRouter wrapper fetches /models first and uses reasoning: effort=high."
          />
          <FeatureCard
            icon="⚡"
            title="Multi-Backend"
            desc="Switch between Node, Go, or Python with a single compose override."
          />
          <FeatureCard
            icon="🎨"
            title="React-Admin"
            desc="Pre-configured admin panel with users resource and data provider."
          />
          <FeatureCard
            icon="🔒"
            title="Best Practices"
            desc="TypeScript, unified error format, health checks, env-based config."
          />
        </section>

        {/* Quick Start */}
        <section className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-6">Quick Start</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-slate-300 mb-3">Mac / Linux</h3>
              <pre className="bg-slate-950 rounded-xl p-4 text-sm overflow-x-auto border border-white/10">
                <code className="text-emerald-400">{`cp .env.example .env
docker compose up -d --build

# Switch to Go backend:
docker compose -f compose.yaml \\
  -f compose.go.yaml up -d --build

# Switch to Python backend:
docker compose -f compose.yaml \\
  -f compose.py.yaml up -d --build`}</code>
              </pre>
            </div>
            <div>
              <h3 className="font-semibold text-slate-300 mb-3">Windows (PowerShell)</h3>
              <pre className="bg-slate-950 rounded-xl p-4 text-sm overflow-x-auto border border-white/10">
                <code className="text-emerald-400">{`Copy-Item .env.example .env
docker compose up -d --build

# Switch to Go backend:
docker compose -f compose.yaml \`
  -f compose.go.yaml up -d --build

# Switch to Python backend:
docker compose -f compose.yaml \`
  -f compose.py.yaml up -d --build`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* API Endpoints */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Available Endpoints</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <EndpointCard method="GET" path="/api/healthz" desc="Health check" />
            <EndpointCard method="GET" path="/api/hello" desc="Hello world" />
            <EndpointCard method="GET" path="/api/admin/users" desc="List users (React-Admin)" />
            <EndpointCard method="GET" path="/api/admin/users/:id" desc="Get user by ID" />
            <EndpointCard method="POST" path="/api/ai/reason" desc="OpenRouter reasoning" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-slate-500 text-sm">
          Built for rapid iteration. Customize freely.
          <br />
          <span className="text-slate-600">
            Use this template • github.com/your-username/project-starter
          </span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard(props: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/[0.07] transition-colors backdrop-blur-sm group">
      <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
        {props.icon}
      </div>
      <h3 className="font-semibold mb-2">{props.title}</h3>
      <p className="text-sm text-slate-400">{props.desc}</p>
    </div>
  );
}

function EndpointCard(props: { method: string; path: string; desc: string }) {
  const methodColors: Record<string, string> = {
    GET: "bg-emerald-500/20 text-emerald-400",
    POST: "bg-blue-500/20 text-blue-400",
    PUT: "bg-amber-500/20 text-amber-400",
    DELETE: "bg-red-500/20 text-red-400",
  };
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center gap-4">
      <span
        className={`px-2 py-1 rounded text-xs font-mono font-semibold ${methodColors[props.method] || "bg-slate-500/20 text-slate-400"
          }`}
      >
        {props.method}
      </span>
      <div>
        <code className="text-sm text-slate-300">{props.path}</code>
        <p className="text-xs text-slate-500 mt-1">{props.desc}</p>
      </div>
    </div>
  );
}
