import { NavLink } from 'react-router-dom'
import { BarChart3, Upload, GitMerge, ShoppingCart, Truck, BrainCircuit, Star } from 'lucide-react'

const nav = [
  { to: '/compare', label: 'Compare', icon: BarChart3, premium: false },
  { to: '/intelligence', label: 'Intelligence', icon: BrainCircuit, premium: false },
  { to: '/upload', label: 'Upload', icon: Upload, premium: false },
  { to: '/items', label: 'Item Catalog', icon: GitMerge, premium: false },
  { to: '/orders', label: 'Orders', icon: ShoppingCart, premium: false },
  { to: '/distributors', label: 'Distributors', icon: Truck, premium: false },
  { to: '/the-table', label: 'The Table', icon: Star, premium: true },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-52 text-white flex flex-col shrink-0" style={{ background: '#071733' }}>
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
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  )
}
