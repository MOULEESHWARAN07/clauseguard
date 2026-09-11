import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts'
import { getRiskColor, RiskBadge, StatCard } from './UI'
import { AlertTriangle, FileText, TrendingUp, Shield } from 'lucide-react'

const CATEGORY_COLORS = {
  penalty: '#ef4444', auto_renewal: '#f97316', liability_cap: '#eab308',
  indemnity: '#a855f7', termination: '#ec4899', ip_ownership: '#06b6d4',
  jurisdiction: '#8b5cf6', confidentiality: '#14b8a6', payment: '#3b82f6',
  warranty: '#22c55e', force_majeure: '#f59e0b', general: '#6b7280'
}

export default function RiskDashboard({ stats, clauses = [], summary }) {
  if (!stats) return null

  const { total_clauses, flagged_count, average_risk_score, score_distribution, category_breakdown, overall_risk } = stats

  // Score distribution chart data
  const scoreData = Object.entries(score_distribution || {}).map(([score, count]) => ({
    score: `Score ${score}`,
    count,
    fill: getRiskColor(Number(score)).hex
  }))

  // Category breakdown chart data
  const categoryData = Object.entries(category_breakdown || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([cat, count]) => ({
      name: cat.replace('_', ' '),
      count,
      fill: CATEGORY_COLORS[cat] || '#6b7280'
    }))

  // Top risky clauses
  const topRisky = [...clauses].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)).slice(0, 5)

  const riskColor = overall_risk === 'High' ? 'red' : overall_risk === 'Medium' ? 'yellow' : 'green'

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Summary */}
      {summary && (
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-2 flex items-center gap-1.5"><FileText size={12} /> AI Summary</div>
          <p className="text-sm text-gray-400 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3">
          <div className="text-xs text-gray-500 mb-1">Overall Risk</div>
          <div className={`text-xl font-semibold text-${riskColor}-400`}>{overall_risk}</div>
          <div className="text-xs text-gray-600">avg score {average_risk_score}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-gray-500 mb-1">Flagged</div>
          <div className="text-xl font-semibold text-orange-400">{flagged_count}</div>
          <div className="text-xs text-gray-600">of {total_clauses} clauses</div>
        </div>
      </div>

      {/* Score Distribution */}
      {scoreData.length > 0 && (
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-3 flex items-center gap-1.5"><TrendingUp size={12} /> Risk Score Distribution</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={scoreData} barSize={28}>
              <XAxis dataKey="score" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#13131a', border: '1px solid #1e1e2e', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#e8e8f0' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {scoreData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Breakdown */}
      {categoryData.length > 0 && (
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-3 flex items-center gap-1.5"><Shield size={12} /> Clause Categories</div>
          <div className="space-y-2">
            {categoryData.map(({ name, count, fill }) => (
              <div key={name} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: fill }} />
                <div className="text-xs text-gray-400 capitalize flex-1">{name}</div>
                <div className="text-xs text-gray-600">{count}</div>
                <div className="w-20 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(count / total_clauses) * 100}%`, background: fill }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Risky Clauses */}
      {topRisky.length > 0 && (
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-3 flex items-center gap-1.5"><AlertTriangle size={12} /> Top Risky Clauses</div>
          <div className="space-y-2">
            {topRisky.map((c, i) => (
              <div key={i} className="p-2 bg-[#0a0a0f] rounded-lg border border-[#1e1e2e]">
                <div className="flex items-center gap-2 mb-1">
                  <RiskBadge score={c.risk_score} />
                  <span className="text-xs text-gray-600 capitalize">{(c.category || 'general').replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
