import React, { useState, useRef, useCallback } from 'react'
import { FileText, MessageSquare, LayoutDashboard, AlertTriangle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import UploadZone from '../components/UploadZone'
import ClausesPanel from '../components/ClausesPanel'
import ChatPanel from '../components/ChatPanel'
import RiskDashboard from '../components/RiskDashboard'
import { RiskBadge, Spinner } from '../components/UI'
import { uploadDocument } from '../services/api'

// Setup pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const TABS = [
  { key: 'clauses', label: 'Clauses', icon: AlertTriangle },
  { key: 'chat', label: 'Chat AI', icon: MessageSquare },
  { key: 'dashboard', label: 'Analytics', icon: LayoutDashboard },
]

export default function AnalyzePage() {
  const [file, setFile] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)
  const [docData, setDocData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('clauses')
  const [pageNum, setPageNum] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [selectedClause, setSelectedClause] = useState(null)
  const containerRef = useRef(null)

  const handleUpload = async (f) => {
    setFile(f)
    setFileUrl(URL.createObjectURL(f))
    setLoading(true)
    setError('')
    setDocData(null)
    setSelectedClause(null)
    try {
      const data = await uploadDocument(f)
      // Fetch full doc with clauses
      const res = await fetch(`/api/documents/${data.doc_id}`)
      const full = await res.json()
      setDocData({ ...data, ...full })
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to process PDF. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (score) => {
    if (score >= 5) return 'rgba(239,68,68,0.25)'
    if (score >= 4) return 'rgba(249,115,22,0.25)'
    if (score >= 3) return 'rgba(234,179,8,0.25)'
    if (score >= 2) return 'rgba(59,130,246,0.2)'
    return 'rgba(107,114,128,0.1)'
  }

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 bg-brand-600/10 rounded-2xl items-center justify-center mb-4">
              <FileText size={24} className="text-brand-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">Analyze a Contract</h1>
            <p className="text-gray-500 text-sm">Upload any PDF — contracts, agreements, policies. AI will extract and score every clause for risk.</p>
          </div>
          <UploadZone onUpload={handleUpload} loading={loading} />
          {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* PDF Viewer */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[#1e1e2e]">
        {/* PDF toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1e1e2e] bg-[#0d0d14]">
          <div className="flex items-center gap-1">
            <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#1e1e2e] disabled:opacity-30 transition-all">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-gray-500 min-w-[60px] text-center">
              {pageNum} / {numPages || '—'}
            </span>
            <button onClick={() => setPageNum(p => Math.min(numPages, p + 1))} disabled={pageNum >= numPages}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#1e1e2e] disabled:opacity-30 transition-all">
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="h-4 w-px bg-[#1e1e2e]" />
          <div className="flex items-center gap-1">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#1e1e2e] transition-all">
              <ZoomOut size={14} />
            </button>
            <span className="text-xs text-gray-600 w-10 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(2, s + 0.1))}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#1e1e2e] transition-all">
              <ZoomIn size={14} />
            </button>
          </div>
          {docData && (
            <>
              <div className="h-4 w-px bg-[#1e1e2e]" />
              <div className="flex items-center gap-2 ml-1">
                <span className="text-xs text-gray-600 truncate max-w-[180px]">{file.name}</span>
                {docData.risk_stats && (
                  <RiskBadge score={docData.risk_stats.average_risk_score} />
                )}
              </div>
            </>
          )}
          <button onClick={() => { setFile(null); setFileUrl(null); setDocData(null) }}
            className="ml-auto text-xs text-gray-600 hover:text-gray-400 transition-colors">
            New doc
          </button>
        </div>

        {/* PDF + overlay */}
        <div className="flex-1 overflow-auto bg-[#08080e] flex justify-center py-4 px-2" ref={containerRef}>
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 text-gray-500">
              <Spinner size={32} />
              <div className="text-sm">Extracting clauses & scoring risks...</div>
              <div className="text-xs text-gray-700">This may take 30-60 seconds on first run</div>
            </div>
          ) : fileUrl ? (
            <div className="relative">
              <Document file={fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={<Spinner size={24} />}
                error={<div className="text-red-400 text-sm">Failed to load PDF</div>}>
                <Page
                  pageNumber={pageNum}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                />
              </Document>

              {/* Risk highlights overlay */}
              {docData?.pages?.[pageNum - 1]?.sentences?.map((sent, i) => {
                if (!sent.bbox) return null
                const clause = docData.clauses?.find(c => c.text === sent.text)
                if (!clause || !clause.flagged) return null
                const [x0, y0, x1, y1] = sent.bbox
                const pageData = docData.pages[pageNum - 1]
                const sw = (containerRef.current?.querySelector('.react-pdf__Page')?.offsetWidth || 600)
                const sh = (containerRef.current?.querySelector('.react-pdf__Page')?.offsetHeight || 800)
                const scaleX = sw / (pageData.width || 595)
                const scaleY = sh / (pageData.height || 842)
                return (
                  <div
                    key={i}
                    onClick={() => { setSelectedClause(clause); setTab('clauses') }}
                    className="pdf-highlight"
                    title={clause.explanation}
                    style={{
                      left: x0 * scaleX,
                      top: y0 * scaleY,
                      width: (x1 - x0) * scaleX,
                      height: Math.max((y1 - y0) * scaleY, 14),
                      background: getRiskColor(clause.risk_score),
                      border: `1px solid ${clause.risk_score >= 4 ? '#ef4444' : clause.risk_score >= 3 ? '#eab308' : '#3b82f6'}`,
                      opacity: 0.7,
                      zIndex: 10
                    }}
                  />
                )
              })}
            </div>
          ) : null}
        </div>
        {error && (
          <div className="p-3 bg-red-500/10 border-t border-red-500/20 text-red-400 text-xs">{error}</div>
        )}
      </div>

      {/* Right panel */}
      <div className="w-[340px] flex-shrink-0 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-[#1e1e2e] bg-[#0d0d14]">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all border-b-2 ${tab === key ? 'border-brand-500 text-brand-400' : 'border-transparent text-gray-600 hover:text-gray-400'}`}>
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {!docData && !loading ? (
            <div className="flex items-center justify-center h-full text-gray-700 text-sm">Upload a document to start</div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600">
              <Spinner size={24} />
              <div className="text-sm">Analyzing document...</div>
            </div>
          ) : (
            <>
              {tab === 'clauses' && (
                <ClausesPanel
                  clauses={docData?.clauses || []}
                  selectedId={selectedClause?.id}
                  onSelectClause={setSelectedClause}
                />
              )}
              {tab === 'chat' && <ChatPanel docId={docData?.doc_id} />}
              {tab === 'dashboard' && (
                <RiskDashboard
                  stats={docData?.risk_stats}
                  clauses={docData?.clauses}
                  summary={docData?.summary}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
