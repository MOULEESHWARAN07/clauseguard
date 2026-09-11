import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle } from 'lucide-react'
import { Spinner } from './UI'

export default function UploadZone({ onUpload, loading, label = 'Drop PDF here or click to browse', compact = false }) {
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback(accepted => {
    if (accepted.length > 0) onUpload(accepted[0])
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: loading
  })

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer
        ${isDragActive ? 'border-brand-500 bg-brand-600/10' : 'border-[#2e2e45] bg-[#13131a] hover:border-brand-600/50 hover:bg-[#16161f]'}
        ${compact ? 'p-6' : 'p-12'}
        ${loading ? 'pointer-events-none opacity-60' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3 text-center">
        {loading ? (
          <>
            <Spinner size={32} />
            <div className="text-sm text-gray-400">Processing document...</div>
            <div className="text-xs text-gray-600">Extracting clauses & scoring risks</div>
          </>
        ) : (
          <>
            <div className={`rounded-xl bg-brand-600/10 flex items-center justify-center ${compact ? 'w-10 h-10' : 'w-14 h-14'}`}>
              <Upload size={compact ? 18 : 24} className="text-brand-400" />
            </div>
            <div>
              <div className={`font-medium text-gray-300 ${compact ? 'text-sm' : 'text-base'}`}>{label}</div>
              <div className="text-xs text-gray-600 mt-1">PDF files only · Max 50MB</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
