import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Shield, AlertTriangle, Trash2, ArrowRight, Upload } from 'lucide-react'
import { listDocuments, deleteDocument } from '../services/api'
import { RiskBadge, Spinner, EmptyState } from '../components/UI'

export default function DashboardPage() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = async () => {
    try {
      const data = await listDocuments()
      setDocs(data.documents || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (e, docId) => {
    e.stopPropagation()
    await deleteDocument(docId)
    load()
  }

  const totalFlagged = docs.reduce((s, d) => s + (d.flagged_count || 0), 0)
  const highRisk = docs.filter(d => d.risk_stats?.overall_risk === 'High').length

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-1">ClauseGuard</h1>
          <p className="text-gray-500 text-sm">AI-powered contract risk analysis · runs 100% locally</p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button onClick={() => navigate('/analyze')}
            className="card p-5 text-left hover:border-brand-600/50 transition-all group">
            <div className="w-10 h-10 bg-brand-600/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-brand-600/20 transition-colors">
              <Upload size={18} className="text-brand-400" />
            </div>
            <div className="font-medium text-gray-200 mb-1">Analyze Document</div>
            <div className="text-xs text-gray-600">Upload a PDF and get instant risk scoring, clause extraction, and AI chat</div>
            <div className="flex items-center gap-1 text-brand-400 text-xs mt-3 font-medium">
              Get started <ArrowRight size={12} />
            </div>
          </button>

          <button onClick={() => navigate('/compare')}
            className="card p-5 text-left hover:border-brand-600/50 transition-all group">
            <div className="w-10 h-10 bg-purple-600/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-600/20 transition-colors">
              <FileText size={18} className="text-purple-400" />
            </div>
            <div className="font-medium text-gray-200 mb-1">Compare Documents</div>
            <div className="text-xs text-gray-600">Upload two contract versions to see what changed and the business impact</div>
            <div className="flex items-center gap-1 text-purple-400 text-xs mt-3 font-medium">
              Compare now <ArrowRight size={12} />
            </div>
          </button>
        </div>

        {/* Stats */}
        {docs.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="card p-4">
              <div className="text-xs text-gray-500 mb-1">Documents</div>
              <div className="text-2xl font-semibold text-white">{docs.length}</div>
              <div className="text-xs text-gray-600">analyzed</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-gray-500 mb-1">Flagged Clauses</div>
              <div className="text-2xl font-semibold text-orange-400">{totalFlagged}</div>
              <div className="text-xs text-gray-600">across all docs</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-gray-500 mb-1">High Risk Docs</div>
              <div className="text-2xl font-semibold text-red-400">{highRisk}</div>
              <div className="text-xs text-gray-600">need attention</div>
            </div>
          </div>
        )}

        {/* Document list */}
        <div>
          <div className="text-sm font-medium text-gray-400 mb-3">Recent Documents</div>
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : docs.length === 0 ? (
            <div className="card">
              <EmptyState icon="📄" title="No documents yet" desc="Upload your first PDF contract to get started with AI risk analysis" />
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.doc_id} onClick={() => navigate('/analyze')}
                  className="card p-4 flex items-center gap-4 hover:border-[#2e2e45] cursor-pointer transition-all group">
                  <div className="w-9 h-9 bg-[#1a1a27] rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-200 truncate">{doc.filename}</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {doc.total_pages} pages · {doc.flagged_count} flagged clauses
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.risk_stats && (
                      <RiskBadge score={doc.risk_stats.average_risk_score} />
                    )}
                    <button onClick={e => handleDelete(e, doc.doc_id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info footer */}
        <div className="mt-8 p-4 bg-[#13131a] border border-[#1e1e2e] rounded-xl">
          <div className="flex items-start gap-3">
            <Shield size={16} className="text-brand-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-300 mb-1">100% Private & Local</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                All AI processing runs locally via Ollama on your machine. Your documents are never sent to any external server. Make sure Ollama is running with <code className="text-brand-400 bg-brand-600/10 px-1 rounded">ollama serve</code> before uploading.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
