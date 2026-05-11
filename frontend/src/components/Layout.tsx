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
      <aside className="w-52 bg-green-900 text-white flex flex-col shrink-0">
        <div className="px-5 py-6 border-b border-green-800">
          <div className="text-xs font-semibold uppercase tracking-widest text-green-400 mb-0.5">Olive &amp; Oregano</div>
          <div className="text-lg font-bold leading-tight">Pricelist<br />Comparator</div>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-green-200 hover:bg-green-800 hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-green-800 text-xs text-green-500">
          Sunday prep tool
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  )
}
