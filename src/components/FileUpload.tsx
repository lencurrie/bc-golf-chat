'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, Loader2 } from 'lucide-react'

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>
  onClose: () => void
}

export default function FileUpload({ onUpload, onClose }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    multiple: false,
  })

  const handleUpload = async () => {
    if (!selectedFile) return
    
    setUploading(true)
    setError(null)
    
    try {
      await onUpload(selectedFile)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setPreview(null)
    setError(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-b border-gray-700 overflow-hidden"
    >
      <div className="p-4">
        {/* Close button */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Upload file</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!selectedFile ? (
          // Dropzone
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragActive ? 'text-blue-400' : 'text-gray-400'}`} />
            <p className="text-sm text-gray-300">
              {isDragActive ? 'Drop the file here' : 'Drag & drop a file, or click to select'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Images, PDFs, and documents up to 10MB
            </p>
          </div>
        ) : (
          // File preview
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-start gap-3">
              {/* Preview thumbnail */}
              <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <File className="w-8 h-8 text-gray-400" />
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
                
                {error && (
                  <p className="text-xs text-red-400 mt-1">{error}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={clearFile}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`w-full mt-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                uploading
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </span>
              ) : (
                'Upload and send'
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
