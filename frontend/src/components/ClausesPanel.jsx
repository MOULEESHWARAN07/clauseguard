import React, { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight, Filter } from 'lucide-react'
import { RiskBadge, CategoryBadge } from './UI'

export default function ClausesPanel({ clauses = [], onSelectClause, selectedId }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'flagged', label: '⚠ Flagged' },
    { key: 'high', label: 'High Risk' },
  ]

  const filtered = clauses.filter(c => {
    if (filter === 'flagged') return c.flagged
    if (filter === 'high') return c.risk_score >= 4
    return true
  }).filter(c => search ? c.text.toLowerCase().includes(search.toLowerCase()) : true)

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="p-3 border-b border-[#1e1e2e] space-y-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search clauses..."
          className="w-full bg-[#0a0a0f] border border-[#2e2e45] rounded-lg px-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-brand-600"
        />
        <div className="flex gap-1">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${filter === f.key ? 'bg-brand-600 text-white' : 'bg-[#1a1a27] text-gray-500 hover:text-gray-300'}`}>
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-600 self-center">{filtered.length} clauses</span>
        </div>
      </div>

      {/* Clause list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-600 text-sm">No clauses match filter</div>
        )}
        {filtered.map(clause => (
          <ClauseCard
            key={clause.id}
            clause={clause}
            selected={selectedId === clause.id}
            onClick={() => onSelectClause(clause)}
          />
        ))}
      </div>
    </div>
  )
}

function ClauseCard({ clause, selected, onClick }) {
  const [expanded, setExpanded] = useState(false)
  const score = clause.risk_score || 1

  const borderColor = score >= 5 ? '#ef4444' : score >= 4 ? '#f97316' : score >= 3 ? '#eab308' : score >= 2 ? '#3b82f6' : '#374151'

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-3 cursor-pointer transition-all duration-150 ${selected ? 'border-brand-600/60 bg-brand-600/5' : 'border-[#1e1e2e] bg-[#13131a] hover:border-[#2e2e45] hover:bg-[#16161f]'}`}
      style={clause.flagged ? { borderLeftColor: borderColor, borderLeftWidth: 3 } : {}}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <RiskBadge score={score} />
          <CategoryBadge category={clause.category || 'general'} />
        </div>
        <button onClick={e => { e.stopPropagation(); setExpanded(!expanded) }} className="text-gray-600 hover:text-gray-400 flex-shrink-0 mt-0.5">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      <p className={`text-xs text-gray-400 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
        {clause.text}
      </p>

      {expanded && clause.explanation && (
        <div className="mt-2 pt-2 border-t border-[#1e1e2e]">
          <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
            <AlertTriangle size={10} /> AI Analysis
          </div>
          <p className="text-xs text-gray-400">{clause.explanation}</p>
        </div>
      )}
    </div>
  )
}
