import React from 'react'
import clsx from 'clsx'

export const getRiskColor = (score) => {
  if (score >= 5) return { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', hex: '#ef4444', label: 'Critical' }
  if (score >= 4) return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', hex: '#f97316', label: 'High' }
  if (score >= 3) return { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30', hex: '#eab308', label: 'Medium' }
  if (score >= 2) return { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', hex: '#3b82f6', label: 'Low' }
  return { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/20', hex: '#6b7280', label: 'None' }
}

export function RiskBadge({ score, size = 'sm' }) {
  const c = getRiskColor(score)
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full border font-medium', c.bg, c.text, c.border,
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm')}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.hex }} />
      {c.label}
    </span>
  )
}

export function CategoryBadge({ category }) {
  const labels = {
    penalty: '⚡ Penalty', auto_renewal: '🔄 Auto-Renewal', liability_cap: '🛡 Liability',
    indemnity: '⚖️ Indemnity', termination: '🚫 Termination', ip_ownership: '💡 IP Rights',
    jurisdiction: '🏛 Jurisdiction', confidentiality: '🔒 Confidentiality',
    payment: '💰 Payment', warranty: '✅ Warranty', force_majeure: '🌪 Force Majeure', general: '📄 General'
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#1e1e2e] text-gray-400 border border-[#2e2e45]">
      {labels[category] || category}
    </span>
  )
}

export function Spinner({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function EmptyState({ icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="text-gray-300 font-medium mb-1">{title}</div>
      <div className="text-gray-600 text-sm max-w-xs">{desc}</div>
    </div>
  )
}

export function StatCard({ label, value, sub, color = 'brand' }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-semibold text-${color}-400`}>{value}</div>
      {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
    </div>
  )
}
