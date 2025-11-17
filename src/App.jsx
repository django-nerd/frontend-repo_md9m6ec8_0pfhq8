import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Spline from '@splinetool/react-spline'

const Stat = ({ label, value, sub }) => (
  <div className="rounded-xl bg-white/70 dark:bg-white/10 backdrop-blur border border-white/30 p-4 shadow-sm">
    <div className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300">{label}</div>
    <div className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
    {sub && <div className="text-xs text-gray-500 dark:text-gray-400">{sub}</div>}
  </div>
)

function LiveTelemetry() {
  const [metrics, setMetrics] = useState({ latency_p95_ms: 150, integrations: 18, control_checks: 42 })

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${baseUrl}/health`)
        if (res.ok) {
          const data = await res.json()
          setMetrics(data)
        }
      } catch (e) {
        // keep defaults
      }
    }
    fetchHealth()
    const id = setInterval(fetchHealth, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="grid grid-cols-3 gap-3">
      <Stat label="Latency (p95)" value={`< ${metrics.latency_p95_ms}ms`} sub="end-to-end" />
      <Stat label="Integrations" value={metrics.integrations} sub="venues connected" />
      <Stat label="Control Checks" value={metrics.control_checks} sub="per route" />
    </div>
  )
}

function LiveChart() {
  const [points, setPoints] = useState([])
  const [status, setStatus] = useState('connecting…')
  const evtRef = useRef(null)

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
    const url = `${baseUrl}/sse/market`
    const es = new EventSource(url)
    evtRef.current = es
    es.onopen = () => setStatus('live')
    es.onerror = () => setStatus('disconnected')
    es.onmessage = (msg) => {
      try {
        const { payload } = JSON.parse(msg.data)
        setPoints((prev) => [...prev.slice(-120), { t: payload.bar.t, c: payload.bar.c }])
      } catch {}
    }
    return () => es.close()
  }, [])

  // simple sparkline
  const path = useMemo(() => {
    if (points.length < 2) return ''
    const w = 280
    const h = 80
    const xs = points.map((p) => p.t)
    const ys = points.map((p) => p.c)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const rangeY = Math.max(1, maxY - minY)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const rangeX = Math.max(1, maxX - minX)

    const mapX = (x) => ((x - minX) / rangeX) * w
    const mapY = (y) => h - ((y - minY) / rangeY) * h

    const d = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.t).toFixed(1)} ${mapY(p.c).toFixed(1)}`)
      .join(' ')
    return { d, w, h }
  }, [points])

  return (
    <div className="rounded-xl border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur p-4">
      <div className="flex items-center justify-between mb-2 text-sm">
        <span className="font-medium">Live Demo</span>
        <span className={status === 'live' ? 'text-green-600' : 'text-amber-600'}>{status}</span>
      </div>
      <svg width={path.w || 280} height={path.h || 80} viewBox={`0 0 ${path.w || 280} ${path.h || 80}`}>
        <path d={path.d} fill="none" stroke="url(#g)" strokeWidth="2" />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0a0a0a] dark:text-white">
      <header className="relative h-[70vh] md:h-[80vh] overflow-hidden">
        <div className="absolute inset-0">
          <Spline scene="https://prod.spline.design/vi0ijCQQJTRFc8LA/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-white pointer-events-none dark:from-black/60 dark:via-black/30 dark:to-black" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 h-full flex items-center">
          <div className="max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold leading-tight"
            >
              Disciplined crypto automation without the hype
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
              className="mt-4 text-lg md:text-xl text-gray-700 dark:text-gray-300"
            >
              Transparent, risk-first pipelines with real-time telemetry and cryptographically signed demo feeds.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }} className="mt-8">
              <LiveTelemetry />
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-10 py-16 space-y-16">
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Four core systems</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { title: 'Signals', text: 'Deterministic models, signed demo outputs, replayable pipelines.' },
              { title: 'Risk', text: 'Multi-layer controllers, circuit breakers, drawdown limits.' },
              { title: 'Execution', text: 'Venue health checks, smart routing, fail-closed design.' },
              { title: 'Automation', text: 'No overrides. Real-time monitoring. Audit-ready.' },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 dark:border-white/10 p-5 bg-white/70 dark:bg-white/5 backdrop-blur">
                <div className="text-lg font-medium mb-1">{f.title}</div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h3 className="text-xl md:text-2xl font-semibold mb-3">Live demo feed</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Signed SSE stream with synthetic market data for demonstration.</p>
            <LiveChart />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-semibold mb-3">Why Hyper</h3>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>Transparency: public metrics, signed payloads, verifiable claims.</li>
              <li>Risk-first: guardrails, limits, and venue monitoring.</li>
              <li>Compliance-ready: audit trails and structured oversight.</li>
              <li>Performance: sub-120ms signal path and continuous telemetry.</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} Hyper Trading Automation — Demo site</footer>
    </div>
  )
}

export default App
