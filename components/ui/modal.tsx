"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Add event listener for escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "auto"
    }
  }, [isOpen, onClose])

  if (!isMounted) return null

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-auto rounded-lg border bg-background shadow-lg">
        <div className="flex items-center justify-between border-b p-4">
          {title && <h2 className="text-xl font-serif">{title}</h2>}
          <Button variant="ghost" size="icon" onClick={onClose} className="ml-auto" aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
