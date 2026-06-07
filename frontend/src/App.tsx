import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Welcome from './pages/Welcome'
import Upload from './pages/Upload'
import Compare from './pages/Compare'
import Items from './pages/Items'
import Orders from './pages/Orders'
import Settings from './pages/Settings'
import Intelligence from './pages/Intelligence'
import Distributors from './pages/Distributors'
import TheMrgn from './pages/TheMrgn'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route element={<Layout><div /></Layout>}>
        {/* nested routes rendered inside Layout */}
      </Route>
      <Route path="/compare" element={<Layout><Compare /></Layout>} />
      <Route path="/upload" element={<Layout><Upload /></Layout>} />
      <Route path="/items" element={<Layout><Items /></Layout>} />
      <Route path="/orders" element={<Layout><Orders /></Layout>} />
      <Route path="/orders/:id" element={<Layout><Orders /></Layout>} />
      <Route path="/settings" element={<Layout><Settings /></Layout>} />
      <Route path="/intelligence" element={<Layout><Intelligence /></Layout>} />
      <Route path="/distributors" element={<Layout><Distributors /></Layout>} />
      <Route path="/the-mrgn" element={<Layout><TheMrgn /></Layout>} />
      <Route path="/the-table" element={<Layout><TheMrgn /></Layout>} />
    </Routes>
  )
}