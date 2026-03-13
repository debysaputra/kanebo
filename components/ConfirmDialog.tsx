"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"
import { AlertTriangle, Trash2, X } from "lucide-react"

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning"
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue>({
  confirm: () => Promise.resolve(false),
})

export function useConfirm() {
  return useContext(ConfirmContext)
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" })
  const resolveRef = useRef<(value: boolean) => void>(() => {})

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts)
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  function handleConfirm() {
    setOpen(false)
    resolveRef.current(true)
  }

  function handleCancel() {
    setOpen(false)
    resolveRef.current(false)
  }

  const isDanger = options.variant === "danger" || !options.variant
  const confirmBtnClass = isDanger
    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    : "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500"
  const iconBgClass = isDanger ? "bg-red-100" : "bg-orange-100"
  const iconColor = isDanger ? "text-red-600" : "text-orange-600"

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {open && (
        <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-confirm-in">
            {/* Close button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition"
            >
              <X size={18} />
            </button>

            <div className="p-6 text-center">
              {/* Icon */}
              <div className={`w-16 h-16 ${iconBgClass} rounded-full flex items-center justify-center mx-auto mb-4`}>
                {isDanger
                  ? <Trash2 size={28} className={iconColor} />
                  : <AlertTriangle size={28} className={iconColor} />}
              </div>

              {/* Title */}
              {options.title && (
                <h3 className="text-lg font-bold text-gray-900 mb-2">{options.title}</h3>
              )}

              {/* Message */}
              <p className="text-gray-500 text-sm leading-relaxed">{options.message}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
              >
                {options.cancelText || "Batal"}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2.5 text-white rounded-xl transition font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmBtnClass}`}
              >
                {options.confirmText || "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
