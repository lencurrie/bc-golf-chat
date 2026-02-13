'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { Attachment } from '@/types/database'

interface ImageLightboxProps {
  isOpen: boolean
  onClose: () => void
  images: Attachment[]
  initialIndex: number
}

export default function ImageLightbox({ isOpen, onClose, images, initialIndex }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [startTouch, setStartTouch] = useState<{ x: number; y: number } | null>(null)
  
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentImage = images[currentIndex]

  // Reset states when image changes
  useEffect(() => {
    setIsZoomed(false)
    setPan({ x: 0, y: 0 })
    setImageLoading(true)
    setImageError(false)
  }, [currentIndex])

  // Reset index when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          navigatePrevious()
          break
        case 'ArrowRight':
          navigateNext()
          break
        case ' ':
          e.preventDefault()
          toggleZoom()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, images.length])

  // Prevent body scrolling when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const navigateNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex, images.length])

  const navigatePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }, [currentIndex])

  const toggleZoom = useCallback(() => {
    setIsZoomed(!isZoomed)
    if (isZoomed) {
      setPan({ x: 0, y: 0 })
    }
  }, [isZoomed])

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = currentImage.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  // Touch/swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setStartTouch({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!startTouch) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - startTouch.x
    const deltaY = touch.clientY - startTouch.y

    // Require minimum distance and horizontal movement
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        navigatePrevious()
      } else {
        navigateNext()
      }
    }

    setStartTouch(null)
  }

  // Mouse handlers for panning when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isZoomed) return
    e.preventDefault()
    
    const startX = e.clientX - pan.x
    const startY = e.clientY - pan.y

    const handleMouseMove = (e: MouseEvent) => {
      setPan({
        x: e.clientX - startX,
        y: e.clientY - startY
      })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen || !currentImage) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
        onClick={handleBackdropClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        ref={containerRef}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-4">
            <span className="text-white text-sm">
              {currentImage.filename}
            </span>
            {images.length > 1 && (
              <span className="text-gray-300 text-sm">
                {currentIndex + 1} of {images.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-white hover:text-gray-300 transition-colors"
              title="Download image"
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={toggleZoom}
              className="p-2 text-white hover:text-gray-300 transition-colors"
              title={isZoomed ? "Zoom out" : "Zoom in"}
            >
              {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-white hover:text-gray-300 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={navigatePrevious}
              disabled={currentIndex === 0}
              className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white transition-all ${
                currentIndex === 0 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-black/70 hover:scale-110'
              }`}
              title="Previous image (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={navigateNext}
              disabled={currentIndex === images.length - 1}
              className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white transition-all ${
                currentIndex === images.length - 1
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-black/70 hover:scale-110'
              }`}
              title="Next image (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Image container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        >
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {imageError ? (
            <div className="text-white text-center p-8">
              <X className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p>Failed to load image</p>
              <p className="text-sm text-gray-400 mt-2">{currentImage.filename}</p>
            </div>
          ) : (
            <img
              ref={imageRef}
              src={currentImage.url}
              alt={currentImage.filename}
              onLoad={handleImageLoad}
              onError={handleImageError}
              onDoubleClick={toggleZoom}
              onMouseDown={handleMouseDown}
              className={`max-w-full max-h-full object-contain transition-transform duration-200 ${
                isZoomed ? 'cursor-move scale-150' : 'cursor-zoom-in'
              }`}
              style={{
                transform: isZoomed 
                  ? `scale(1.5) translate(${pan.x / 1.5}px, ${pan.y / 1.5}px)`
                  : undefined,
                userSelect: 'none'
              }}
              draggable={false}
            />
          )}
        </motion.div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm text-center opacity-70">
          <p>
            {images.length > 1 && 'Use ← → arrows or swipe to navigate • '}
            Double-click or spacebar to zoom • ESC to close
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}