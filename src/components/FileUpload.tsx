'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, Loader2, Image, FileText, Archive } from 'lucide-react'

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>
  onClose: () => void
  pendingFiles?: File[]
  onRemoveFile?: (index: number) => void
}

interface FileWithPreview {
  file: File
  preview?: string
  uploading: boolean
  error?: string
}

export default function FileUpload({ onUpload, onClose, pendingFiles = [], onRemoveFile }: FileUploadProps) {
  const [filesWithPreviews, setFilesWithPreviews] = useState<FileWithPreview[]>([])
  const [dragActive, setDragActive] = useState(false)

  // Initialize with pending files
  useEffect(() => {
    if (pendingFiles.length > 0) {
      const newFiles = pendingFiles.map(file => ({ file, uploading: false }))
      setFilesWithPreviews(newFiles)
      
      // Generate previews for images
      newFiles.forEach((fileWithPreview, index) => {
        if (fileWithPreview.file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = () => {
            setFilesWithPreviews(prev => prev.map((f, i) => 
              i === index ? { ...f, preview: reader.result as string } : f
            ))
          }
          reader.readAsDataURL(fileWithPreview.file)
        }
      })
    }
  }, [pendingFiles])

  const validateFile = (file: File): string | null => {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return 'File size must be less than 5MB'
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ]

    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported'
    }

    return null
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles: FileWithPreview[] = []
    
    acceptedFiles.forEach(file => {
      const error = validateFile(file)
      const fileWithPreview: FileWithPreview = {
        file,
        uploading: false,
        error: error || undefined
      }
      validFiles.push(fileWithPreview)

      // Generate preview for images
      if (file.type.startsWith('image/') && !error) {
        const reader = new FileReader()
        reader.onload = () => {
          setFilesWithPreviews(prev => prev.map(f => 
            f.file === file ? { ...f, preview: reader.result as string } : f
          ))
        }
        reader.readAsDataURL(file)
      }
    })

    setFilesWithPreviews(prev => [...prev, ...validFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    },
    multiple: true,
    noClick: filesWithPreviews.length > 0,
  })

  useEffect(() => {
    setDragActive(isDragActive)
  }, [isDragActive])

  const handleUpload = async (index: number) => {
    const fileWithPreview = filesWithPreviews[index]
    if (!fileWithPreview || fileWithPreview.error) return
    
    setFilesWithPreviews(prev => prev.map((f, i) => 
      i === index ? { ...f, uploading: true, error: undefined } : f
    ))
    
    try {
      await onUpload(fileWithPreview.file)
      // Remove file after successful upload
      removeFile(index)
    } catch {
      setFilesWithPreviews(prev => prev.map((f, i) => 
        i === index ? { ...f, uploading: false, error: 'Upload failed. Please try again.' } : f
      ))
    }
  }

  const handleUploadAll = async () => {
    const validFiles = filesWithPreviews.filter(f => !f.error && !f.uploading)
    
    for (let i = 0; i < validFiles.length; i++) {
      const fileIndex = filesWithPreviews.findIndex(f => f === validFiles[i])
      if (fileIndex !== -1) {
        await handleUpload(fileIndex)
      }
    }
  }

  const removeFile = (index: number) => {
    setFilesWithPreviews(prev => prev.filter((_, i) => i !== index))
    onRemoveFile?.(index)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image
    if (mimeType === 'application/pdf') return FileText
    if (mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('text')) return FileText
    return Archive
  }

  const hasValidFiles = filesWithPreviews.some(f => !f.error)
  const allUploading = filesWithPreviews.some(f => f.uploading)

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-b border-gray-700 overflow-hidden"
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">
            {filesWithPreviews.length > 0 
              ? `Upload ${filesWithPreviews.length} file${filesWithPreviews.length !== 1 ? 's' : ''}` 
              : 'Upload files'
            }
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {filesWithPreviews.length === 0 ? (
          // Dropzone
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`w-8 h-8 mx-auto mb-2 ${dragActive ? 'text-blue-400' : 'text-gray-400'}`} />
            <p className="text-sm text-gray-300">
              {dragActive ? 'Drop files here' : 'Drag & drop files, or click to select'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Images, PDFs, and documents up to 5MB each
            </p>
          </div>
        ) : (
          // File previews
          <div className="space-y-3">
            {/* Add more files dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className={`w-5 h-5 mx-auto mb-1 ${dragActive ? 'text-blue-400' : 'text-gray-400'}`} />
              <p className="text-xs text-gray-300">
                {dragActive ? 'Drop more files' : 'Add more files'}
              </p>
            </div>

            {/* File list */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filesWithPreviews.map((fileWithPreview, index) => {
                const { file, preview, uploading, error } = fileWithPreview
                const FileIcon = getFileIcon(file.type)

                return (
                  <div
                    key={`${file.name}-${index}`}
                    className="bg-gray-800/50 rounded-lg p-3 flex items-start gap-3"
                  >
                    {/* Preview/Icon */}
                    <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <FileIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                      
                      {error && (
                        <p className="text-xs text-red-400 mt-1">{error}</p>
                      )}
                      
                      {uploading && (
                        <div className="flex items-center gap-2 mt-1">
                          <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                          <p className="text-xs text-blue-400">Uploading...</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!error && !uploading && (
                        <button
                          onClick={() => handleUpload(index)}
                          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                          Send
                        </button>
                      )}
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        disabled={uploading}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Upload all button */}
            {hasValidFiles && (
              <button
                onClick={handleUploadAll}
                disabled={allUploading}
                className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                  allUploading
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {allUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  `Send all files (${filesWithPreviews.filter(f => !f.error).length})`
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}