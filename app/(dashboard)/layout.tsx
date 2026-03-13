"use client"

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import { usePathname } from "next/navigation"

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/accounts": "Akun",
  "/transactions": "Transaksi",
  "/categories": "Kategori",
  "/budgets": "Anggaran",
  "/reports": "Laporan",
  "/goals": "Tujuan Keuangan",
  "/debts": "Hutang & Piutang",
  "/admin": "Manajemen User",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const title = pageTitles[pathname] || "Kanebo"

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
