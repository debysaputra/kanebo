"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Tag,
  Target,
  BarChart3,
  TrendingUp,
  X,
  ShieldCheck,
} from "lucide-react"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/accounts", icon: Wallet, label: "Akun" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transaksi" },
  { href: "/categories", icon: Tag, label: "Kategori" },
  { href: "/budgets", icon: Target, label: "Anggaran" },
  { href: "/reports", icon: BarChart3, label: "Laporan" },
  { href: "/goals", icon: TrendingUp, label: "Tujuan" },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin"

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg leading-none">Kanebo</h1>
              <p className="text-xs text-gray-500">Keuangan Pribadi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <Icon
                  size={20}
                  className={isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"}
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}

          {/* Admin menu - only visible to admins */}
          {isAdmin && (
            <div className="pt-3 mt-3 border-t border-gray-100">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Admin
              </p>
              <Link
                href="/admin"
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${
                    pathname === "/admin"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <ShieldCheck
                  size={20}
                  className={pathname === "/admin" ? "text-white" : "text-gray-400 group-hover:text-gray-600"}
                />
                <span className="font-medium">Manajemen User</span>
              </Link>
            </div>
          )}
        </nav>
      </aside>
    </>
  )
}
