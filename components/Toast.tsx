"use client"

import { createContext, useCallback, useContext, useState } from "react"
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++nextId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
              pointer-events-auto min-w-64 max-w-sm animate-slide-in
              ${t.type === "success" ? "bg-green-600 text-white"
                : t.type === "error" ? "bg-red-600 text-white"
                : "bg-gray-800 text-white"}`}
          >
            {t.type === "success" ? (
              <CheckCircle2 size={18} className="flex-shrink-0" />
            ) : t.type === "error" ? (
              <XCircle size={18} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="flex-shrink-0" />
            )}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
