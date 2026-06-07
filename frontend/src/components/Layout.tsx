import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { BarChart3, Upload, GitMerge, ShoppingCart, Truck, BrainCircuit, Star, Menu, X } from 'lucide-react'

const nav = [
  { to: '/compare',      label: 'Compare',      icon: BarChart3,    premium: false },
  { to: '/intelligence', label: 'Intelligence',  icon: BrainCircuit, premium: false },
  { to: '/upload',       label: 'Upload',        icon: Upload,       premium: false },
  { to: '/items',        label: 'Item Catalog',  icon: GitMerge,     premium: false },
  { to: '/orders',       label: 'Orders',        icon: ShoppingCart, premium: false },
  { to: '/distributors', label: 'Distributors',  icon: Truck,        premium: false },
  { to: '/the-mrgn',    label: 'The Mrgn™',     icon: Star,         premium: true  },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const SidebarContent = () => (
    <>
      <div className="px-5 py-6" style={{ borderBottom: '1px solid rgba(96,165,250,0.12)' }}>
        <div className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#60a5fa' }}>
          Olive &amp; Oregano
        </div>
        <div className="text-lg font-bold leading-tight text-white">
          Pricelist<br />Comparator
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {nav.map(({ to, label, icon: Icon, premium }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'text-white' : 'hover:text-white'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? { background: premium ? 'rgba(124,58,237,0.55)' : 'rgba(30,64,175,0.7)', color: '#fff' }
                : { color: premium ? 'rgba(196,181,253,0.7)' : 'rgba(147,197,253,0.6)' }
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} style={{ color: isActive ? (premium ? '#c4b5fd' : '#93c5fd') : (premium ? 'rgba(196,181,253,0.6)' : 'rgba(147,197,253,0.5)') }} />
                <span className="flex-1">{label}</span>
                {premium && (
                  <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(124,58,237,0.4)', color: '#c4b5fd' }}>
                    PRO
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 text-xs" style={{ borderTop: '1px solid rgba(96,165,250,0.1)', color: 'rgba(96,165,250,0.4)' }}>
        Sunday prep tool
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Desktop sidebar (md+) ── */}
      <aside
        className="hidden md:flex w-52 text-white flex-col shrink-0"
        style={{ background: '#071733' }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile: top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: '#071733', borderBottom: '1px solid rgba(96,165,250,0.12)' }}>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#60a5fa' }}>
            Olive &amp; Oregano
          </div>
          <div className="text-sm font-bold text-white leading-tight">Pricelist Comparator</div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg"
          style={{ color: '#93c5fd' }}
        >
          <Menu size={22} />
        </button>
      </div>

      {/* ── Mobile: slide-out sidebar overlay ── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(4,10,28,0.72)', backdropFilter: 'blur(4px)' }}
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <aside
            className="relative flex flex-col w-64 h-full text-white shrink-0"
            style={{ background: '#071733' }}
          >
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(96,165,250,0.12)' }}>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#60a5fa' }}>
                  Olive &amp; Oregano
                </div>
                <div className="text-base font-bold text-white">Pricelist Comparator</div>
              </div>
              <button onClick={() => setOpen(false)} style={{ color: 'rgba(147,197,253,0.5)' }}>
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
              {nav.map(({ to, label, icon: Icon, premium }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'text-white' : 'hover:text-white'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? { background: premium ? 'rgba(124,58,237,0.55)' : 'rgba(30,64,175,0.7)', color: '#fff' }
                      : { color: premium ? 'rgba(196,181,253,0.7)' : 'rgba(147,197,253,0.6)' }
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} style={{ color: isActive ? (premium ? '#c4b5fd' : '#93c5fd') : (premium ? 'rgba(196,181,253,0.6)' : 'rgba(147,197,253,0.5)') }} />
                      <span className="flex-1">{label}</span>
                      {premium && (
                        <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(124,58,237,0.4)', color: '#c4b5fd' }}>
                          PRO
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="px-4 py-4 text-xs" style={{ borderTop: '1px solid rgba(96,165,250,0.1)', color: 'rgba(96,165,250,0.4)' }}>
              Sunday prep tool
            </div>
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto bg-gray-50 md:pt-0 pt-14">
        {children}
      </main>
    </div>
  )
}
