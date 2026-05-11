import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const TICKER_ITEMS = [
  { dist: 'GINSBERGS', item: 'Chicken Breast', price: '$3.82', change: '+2.1%', up: true },
  { dist: 'SYSCO', item: 'Bacon 10 lb', price: '$18.90', change: '-1.5%', up: false },
  { dist: 'US FOODS', item: 'Extra Virgin Olive Oil', price: '$42.50', change: '+0.8%', up: true },
  { dist: 'GINSBERGS', item: 'Ground Beef 80/20', price: '$4.20', change: '-3.2%', up: false },
  { dist: 'SYSCO', item: 'All-Purpose Flour 50 lb', price: '$28.50', change: '±0.0%', neutral: true },
  { dist: 'US FOODS', item: 'Jasmine Rice 50 lb', price: '$31.80', change: '+1.2%', up: true },
  { dist: 'GINSBERGS', item: 'Black Beans 6/#10', price: '$6.21', change: '-0.5%', up: false },
  { dist: 'SYSCO', item: 'Garbanzo Beans 6/#10', price: '$5.66', change: '+3.8%', up: true },
  { dist: 'US FOODS', item: 'Crushed Tomatoes', price: '$4.80', change: '-1.0%', up: false },
  { dist: 'GINSBERGS', item: 'Canola Oil 35 lb', price: '$38.20', change: '+0.3%', up: true },
  { dist: 'SYSCO', item: 'Yellow Onions 50 lb', price: '$0.62', change: '-4.5%', up: false },
  { dist: 'US FOODS', item: 'Boneless Chuck Roll', price: '$4.61', change: '+5.2%', up: true },
]

const DOUBLED = [...TICKER_ITEMS, ...TICKER_ITEMS]

export default function Welcome() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Cobalt particles
    const particles: {
      x: number; y: number; vx: number; vy: number; alpha: number; size: number
    }[] = []
    for (let i = 0; i < 75; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        alpha: Math.random() * 0.32 + 0.04,
        size: Math.random() * 1.4 + 0.3,
      })
    }

    // Pulse rings
    const rings: { r: number; alpha: number }[] = []
    let ringTimer = 0
    let gridOff = 0
    let t = 0
    let animId: number

    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // ── Cobalt blue background ──
      const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      bg.addColorStop(0, '#071733')
      bg.addColorStop(0.45, '#0b1e42')
      bg.addColorStop(1, '#060e24')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // ── Drifting cobalt grid ──
      gridOff = (gridOff + 0.1) % 60
      ctx.save()
      ctx.strokeStyle = 'rgba(37,99,235,0.05)'
      ctx.lineWidth = 0.5
      for (let x = -(60 - gridOff % 60); x < canvas.width + 60; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
      }
      for (let y = -(60 - gridOff % 60); y < canvas.height + 60; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
      }
      ctx.restore()

      t += 0.005

      // ── Cobalt left ambient (behind text) ──
      const ambL = ctx.createRadialGradient(
        canvas.width * 0.15, canvas.height * 0.5, 0,
        canvas.width * 0.15, canvas.height * 0.5, canvas.width * 0.5,
      )
      ambL.addColorStop(0, 'rgba(29,78,216,0.20)')
      ambL.addColorStop(0.5, 'rgba(37,99,235,0.07)')
      ambL.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = ambL
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // ── Cobalt right ambient ──
      const ambR = ctx.createRadialGradient(
        canvas.width * 0.78, canvas.height * 0.38, 0,
        canvas.width * 0.78, canvas.height * 0.38, canvas.width * 0.48,
      )
      ambR.addColorStop(0, 'rgba(30,64,175,0.14)')
      ambR.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = ambR
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // ── METALLIC PLATINUM BEAM ──
      const beamX = canvas.width * 0.62
      const beamH = canvas.height * 0.88
      const beamW = 280
      const pulse = Math.sin(t) * 0.03

      const beamGrad = ctx.createLinearGradient(beamX, 0, beamX, beamH)
      beamGrad.addColorStop(0, `rgba(248,250,254,${0.94 + pulse})`)   // bright platinum
      beamGrad.addColorStop(0.05, `rgba(225,232,244,${0.68 + pulse})`) // platinum
      beamGrad.addColorStop(0.15, `rgba(195,210,232,${0.26})`)          // cool silver
      beamGrad.addColorStop(0.38, `rgba(140,168,210,${0.09})`)          // silver-cobalt
      beamGrad.addColorStop(0.65, `rgba(70,110,180,${0.035})`)          // cobalt fade
      beamGrad.addColorStop(1, 'rgba(0,0,0,0)')

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(beamX, 0)
      ctx.lineTo(beamX - beamW, beamH)
      ctx.lineTo(beamX + beamW, beamH)
      ctx.closePath()
      ctx.fillStyle = beamGrad
      ctx.fill()
      ctx.restore()

      // ── Metallic sheen sweep (every 6s) ──
      const shimT = (t * 0.3) % 1
      if (shimT < 0.65) {
        const shimY = shimT * beamH * 1.3
        const shimW = (shimY / beamH) * beamW * 2.2
        const shimG = ctx.createLinearGradient(beamX - shimW / 2, shimY, beamX + shimW / 2, shimY)
        shimG.addColorStop(0, 'rgba(255,255,255,0)')
        shimG.addColorStop(0.4, `rgba(245,250,255,${0.14 * (1 - shimT * 0.6)})`)
        shimG.addColorStop(0.5, `rgba(255,255,255,${0.26 * (1 - shimT * 0.6)})`)
        shimG.addColorStop(0.6, `rgba(245,250,255,${0.14 * (1 - shimT * 0.6)})`)
        shimG.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = shimG
        ctx.fillRect(beamX - shimW / 2, shimY - 2, shimW, 5)
      }

      // ── Platinum point glow at beam origin ──
      const topG = ctx.createRadialGradient(beamX, 0, 0, beamX, 0, 280)
      topG.addColorStop(0, `rgba(250,252,255,${0.88 + Math.sin(t * 1.6) * 0.07})`)
      topG.addColorStop(0.1, `rgba(222,232,248,0.32)`)
      topG.addColorStop(0.3, `rgba(150,185,235,0.09)`)
      topG.addColorStop(0.65, `rgba(50,90,190,0.03)`)
      topG.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = topG
      ctx.fillRect(beamX - 280, -14, 560, 296)

      // ── Pulse rings from beam origin ──
      ringTimer++
      if (ringTimer > 95) {
        rings.push({ r: 2, alpha: 0.38 })
        ringTimer = 0
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        rings[i].r += 2.2
        rings[i].alpha *= 0.972
        if (rings[i].alpha < 0.005) { rings.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(beamX, 0, rings[i].r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(200,218,248,${rings[i].alpha})`
        ctx.lineWidth = 0.8
        ctx.stroke()
      }

      // ── Cobalt particles ──
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(96,165,250,${p.alpha})`
        ctx.fill()
      })

      // ── Vignette ──
      const vig = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.18,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.88,
      )
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(3,8,22,0.58)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      animId = requestAnimationFrame(draw)
    }

    draw()

    const onResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#071733' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Dot texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(96,165,250,0.045) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* ── Top nav ── */}
      <div className="relative z-10 flex items-center justify-between px-10 pt-7">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.28)' }}
          >
            <span className="font-black text-xs" style={{ color: '#93c5fd' }}>O</span>
          </div>
          <span className="font-semibold text-xs tracking-[0.18em] uppercase" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Olive &amp; Oregano
          </span>
        </div>

        <div
          className="flex items-center gap-0.5 rounded-full px-1.5 py-1"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {[
            { label: 'Portfolio', path: '/compare' },
            { label: 'Intelligence', path: '/intelligence' },
            { label: 'Upload', path: '/upload' },
            { label: 'Orders', path: '/orders' },
          ].map((item, i) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={
                i === 0
                  ? { background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.92)' }
                  : { color: 'rgba(255,255,255,0.32)' }
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero — LEFT aligned ── */}
      <div
        className="relative z-10 flex flex-col justify-center h-full px-16 pb-44"
        style={{ maxWidth: '50%' }}
      >
        {/* Status pill */}
        <div
          className="mb-8 inline-flex items-center gap-2 w-fit rounded-full px-4 py-1.5"
          style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#60a5fa' }}
          />
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: 'rgba(147,197,253,0.8)' }}
          >
            Food Cost Intelligence
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-black leading-[0.93] tracking-tight mb-7"
          style={{ fontSize: '72px' }}
        >
          <span className="block" style={{ color: '#ffffff' }}>Control Your</span>
          <span className="block" style={{ color: '#ffffff' }}>Food Costs.</span>
          <span className="block" style={{ color: 'rgba(96,165,250,0.22)' }}>Own Every</span>
          <span className="block" style={{ color: 'rgba(96,165,250,0.22)' }}>Margin.</span>
        </h1>

        <p
          className="text-sm leading-relaxed max-w-[300px] mb-10"
          style={{ color: 'rgba(147,197,253,0.38)' }}
        >
          Upload distributor pricelists every Sunday. Instantly see who's cheapest — by item, by category, week over week.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/compare')}
            className="flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-semibold transition-all"
            style={{
              background: 'rgba(96,165,250,0.10)',
              border: '1px solid rgba(96,165,250,0.25)',
              color: '#fff',
            }}
          >
            <span
              className="flex items-center justify-center w-5 h-5 rounded-full"
              style={{ border: '1px solid rgba(52,211,153,0.4)', background: 'rgba(52,211,153,0.10)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }} />
            </span>
            Open Dashboard
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="px-6 py-3 rounded-full text-sm font-medium transition-all"
            style={{ border: '1px solid rgba(96,165,250,0.1)', color: 'rgba(147,197,253,0.38)' }}
          >
            Upload Pricelist
          </button>
        </div>
      </div>

      {/* ── LIVE TICKER STRIP ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        {/* Fade above ticker */}
        <div
          className="h-24"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(6,14,32,0.92))' }}
        />

        {/* Ticker bar */}
        <div
          className="relative overflow-hidden pointer-events-auto"
          style={{
            height: '50px',
            background: 'rgba(5,12,30,0.97)',
            borderTop: '1px solid rgba(96,165,250,0.14)',
          }}
        >
          {/* LIVE badge — fixed left */}
          <div
            className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-2 px-4"
            style={{
              background: 'linear-gradient(to right, rgba(5,12,30,1) 75%, transparent)',
              minWidth: '96px',
            }}
          >
            <span
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
              style={{ color: '#f87171' }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: '#ef4444', boxShadow: '0 0 7px 2px rgba(239,68,68,0.6)' }}
              />
              LIVE
            </span>
            <div
              className="w-px h-5"
              style={{ background: 'rgba(96,165,250,0.2)' }}
            />
          </div>

          {/* Scrolling items */}
          <div className="flex items-center h-full" style={{ paddingLeft: '96px' }}>
            <style>{`
              @keyframes ticker-scroll {
                0%   { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .live-ticker {
                display: flex;
                align-items: center;
                white-space: nowrap;
                animation: ticker-scroll 72s linear infinite;
                will-change: transform;
              }
              .live-ticker:hover {
                animation-play-state: paused;
              }
            `}</style>
            <div className="live-ticker">
              {DOUBLED.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-2" style={{ margin: '0 20px' }}>
                  <span
                    className="text-[9px] font-black tracking-[0.15em] uppercase"
                    style={{ color: 'rgba(96,165,250,0.55)' }}
                  >
                    {item.dist}
                  </span>
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                  >
                    {item.item}
                  </span>
                  <span
                    className="text-[12px] font-bold tabular-nums"
                    style={{ color: 'rgba(255,255,255,0.88)' }}
                  >
                    {item.price}
                  </span>
                  <span
                    className="text-[10px] font-bold tabular-nums"
                    style={{
                      color: item.neutral
                        ? 'rgba(148,163,184,0.6)'
                        : item.up
                        ? '#f87171'
                        : '#34d399',
                    }}
                  >
                    {item.up ? '▲' : item.neutral ? '▬' : '▼'}&thinsp;{item.change}
                  </span>
                  <span style={{ color: 'rgba(96,165,250,0.18)', marginLeft: '8px', fontSize: '13px' }}>
                    |
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Fade right edge */}
          <div
            className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none"
            style={{ background: 'linear-gradient(to left, rgba(5,12,30,1), transparent)' }}
          />
        </div>
      </div>
    </div>
  )
}
