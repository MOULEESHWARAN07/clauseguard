import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { Shield, FileText, GitCompare, LayoutDashboard, Menu, X } from 'lucide-react'
import AnalyzePage from './pages/AnalyzePage'
import ComparePage from './pages/ComparePage'
import DashboardPage from './pages/DashboardPage'

function Sidebar({ open, setOpen }) {
  const nav = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/analyze', icon: FileText, label: 'Analyze Doc' },
    { to: '/compare', icon: GitCompare, label: 'Compare Docs' },
  ]
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-56 bg-[#0d0d14] border-r border-[#1e1e2e] z-30 flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#1e1e2e]">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">ClauseGuard</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-brand-600/20 text-brand-400' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a27]'
                }`}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-[#1e1e2e]">
          <div className="text-xs text-gray-600">Powered by Ollama + LLaMA</div>
          <div className="text-xs text-gray-700">100% local · no data shared</div>
        </div>
      </aside>
    </>
  )
}

function Layout({ children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      <Sidebar open={open} setOpen={setOpen} />
      <div className="flex-1 flex flex-col md:ml-56 overflow-hidden">
        <header className="h-12 border-b border-[#1e1e2e] flex items-center px-4 md:hidden">
          <button onClick={() => setOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={20} />
          </button>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
