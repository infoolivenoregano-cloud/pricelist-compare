import { NavLink } from 'react-router-dom'
import { BarChart3, Upload, GitMerge, ShoppingCart, Settings, BrainCircuit } from 'lucide-react'

const nav = [
  { to: '/compare', label: 'Compare', icon: BarChart3 },
  { to: '/intelligence', label: 'Intelligence', icon: BrainCircuit },
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/items', label: 'Item Catalog', icon: GitMerge },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/settings', label: 'Distributors', icon: Settings },
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
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'hover:text-white'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: 'rgba(30,64,175,0.7)', color: '#fff' }
                  : { color: 'rgba(147,197,253,0.6)' }
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} style={{ color: isActive ? '#93c5fd' : 'rgba(147,197,253,0.5)' }} />
                  {label}
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
