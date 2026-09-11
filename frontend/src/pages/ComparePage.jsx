import React, { useState } from 'react'
import { GitCompare, Plus, Minus, RefreshCw, AlertCircle } from 'lucide-react'
import UploadZone from '../components/UploadZone'
import { compareDocuments } from '../services/api'
import { Spinner } from '../components/UI'

const TYPE_STYLES = {
  added:    { cls: 'diff-added',    icon: <Plus size={11} className="text-green-400" />,  label: 'Added',    color: 'text-green-400' },
  removed:  { cls: 'diff-removed',  icon: <Minus size={11} className="text-red-400" />,   label: 'Removed',  color: 'text-red-400' },
  modified: { cls: 'diff-modified', icon: <RefreshCw size={11} className="text-yellow-400" />, label: 'Changed', color: 'text-yellow-400' },
  equal:    { cls: '',              icon: null, label: 'Same', color: 'text-gray-600' }
}

export default function ComparePage() {
  const [file1, setFile1] = useState(null)
  const [file2, setFile2] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showEqual, setShowEqual] = useState(false)

  const canCompare = file1 && file2 && !loading

  const handleCompare = async () => {
    if (!canCompare) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await compareDocuments(file1, file2)
      setResult(data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Comparison failed. Ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const diffs = result?.diff?.filter(d => showEqual ? true : d.type !== 'equal') || []

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white mb-1">Compare Documents</h1>
          <p className="text-sm text-gray-500">Upload two versions of a contract to see what changed and the business impact.</p>
        </div>

        {/* Upload row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 text-[10px] font-bold">A</div>
              Original Document
            </div>
            {file1 ? (
              <div className="card p-3 flex items-center justify-between">
                <span className="text-sm text-gray-300 truncate">{file1.name}</span>
                <button onClick={() => setFile1(null)} className="text-gray-600 hover:text-red-400 text-xs ml-2">✕</button>
              </div>
            ) : (
              <UploadZone onUpload={setFile1} label="Drop original PDF" compact />
            )}
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-purple-500/20 flex items-center justify-center text-purple-400 text-[10px] font-bold">B</div>
              Revised Document
            </div>
            {file2 ? (
              <div className="card p-3 flex items-center justify-between">
                <span className="text-sm text-gray-300 truncate">{file2.name}</span>
                <button onClick={() => setFile2(null)} className="text-gray-600 hover:text-red-400 text-xs ml-2">✕</button>
              </div>
            ) : (
              <UploadZone onUpload={setFile2} label="Drop revised PDF" compact />
            )}
          </div>
        </div>

        <button onClick={handleCompare} disabled={!canCompare}
          className="btn-primary w-full justify-center py-2.5 mb-6 disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? <><Spinner size={16} /> Comparing...</> : <><GitCompare size={16} /> Compare Documents</>}
        </button>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Added', val: result.stats.added, color: 'text-green-400' },
                { label: 'Removed', val: result.stats.removed, color: 'text-red-400' },
                { label: 'Modified', val: result.stats.modified, color: 'text-yellow-400' },
                { label: 'Unchanged', val: result.stats.unchanged, color: 'text-gray-500' },
              ].map(s => (
                <div key={s.label} className="card p-3 text-center">
                  <div className={`text-2xl font-semibold ${s.color}`}>{s.val}</div>
                  <div className="text-xs text-gray-600">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Toggle unchanged */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-300">Clause Changes ({diffs.length})</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500">Show unchanged</span>
                <div onClick={() => setShowEqual(!showEqual)}
                  className={`w-8 h-4 rounded-full transition-colors ${showEqual ? 'bg-brand-600' : 'bg-[#2e2e45]'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white m-0.5 transition-transform ${showEqual ? 'translate-x-4' : ''}`} />
                </div>
              </label>
            </div>

            {/* Diff list */}
            <div className="space-y-2">
              {diffs.map((d, i) => {
                const style = TYPE_STYLES[d.type]
                if (!style) return null
                if (d.type === 'equal' && !showEqual) return null
                return (
                  <div key={i} className={`card p-4 ${style.cls}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {style.icon}
                      <span className={`text-xs font-medium ${style.color}`}>{style.label}</span>
                    </div>

                    {d.type === 'modified' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Before</div>
                          <p className="text-xs text-gray-400 leading-relaxed bg-red-500/5 rounded p-2 border border-red-500/10">{d.original}</p>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">After</div>
                          <p className="text-xs text-gray-400 leading-relaxed bg-green-500/5 rounded p-2 border border-green-500/10">{d.modified}</p>
                        </div>
                        {d.impact && (
                          <div className="col-span-2 pt-2 border-t border-[#1e1e2e]">
                            <div className="text-xs text-gray-600 mb-1">⚡ Business Impact</div>
                            <p className="text-xs text-yellow-400/80 leading-relaxed">{d.impact}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 leading-relaxed">{d.original || d.modified}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
