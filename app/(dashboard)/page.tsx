"use client"

import { useEffect, useState } from "react"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Loader2,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface DashboardData {
  totalBalance: number
  income: number
  expense: number
  netSavings: number
  recentTransactions: RecentTransaction[]
  monthlyTrend: MonthlyTrend[]
  categorySpending: CategorySpending[]
}

interface RecentTransaction {
  _id: string
  type: "income" | "expense" | "transfer"
  amount: number
  description: string
  date: string
  accountId: { name: string; color: string; icon: string }
  categoryId: { name: string; color: string; icon: string } | null
}

interface MonthlyTrend {
  _id: { year: number; month: number; type: string }
  total: number
}

interface CategorySpending {
  _id: string
  name: string
  color: string
  icon: string
  total: number
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"]

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/dashboard")
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error("Dashboard fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    )
  }

  if (!data) return null

  // Process monthly trend data for chart
  const trendMap: Record<string, { month: string; income: number; expense: number }> = {}
  data.monthlyTrend.forEach((item) => {
    const key = `${item._id.year}-${item._id.month}`
    if (!trendMap[key]) {
      trendMap[key] = {
        month: MONTH_NAMES[item._id.month - 1],
        income: 0,
        expense: 0,
      }
    }
    trendMap[key][item._id.type as "income" | "expense"] = item.total
  })
  const trendData = Object.values(trendMap)

  const summaryCards = [
    {
      title: "Total Saldo",
      value: data.totalBalance,
      icon: Wallet,
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      textColor: "text-blue-600",
    },
    {
      title: "Pemasukan Bulan Ini",
      value: data.income,
      icon: TrendingUp,
      color: "green",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      textColor: "text-green-600",
    },
    {
      title: "Pengeluaran Bulan Ini",
      value: data.expense,
      icon: TrendingDown,
      color: "red",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      textColor: "text-red-600",
    },
    {
      title: "Tabungan Bersih",
      value: data.netSavings,
      icon: PiggyBank,
      color: "purple",
      bgColor: data.netSavings >= 0 ? "bg-purple-50" : "bg-orange-50",
      iconColor: data.netSavings >= 0 ? "text-purple-600" : "text-orange-600",
      textColor: data.netSavings >= 0 ? "text-purple-600" : "text-orange-600",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.textColor}`}>
                    {formatRupiah(card.value)}
                  </p>
                </div>
                <div className={`p-3 ${card.bgColor} rounded-xl`}>
                  <Icon size={22} className={card.iconColor} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Trend Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tren 6 Bulan Terakhir</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trendData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => formatRupiah(Number(value))}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                />
                <Legend />
                <Bar dataKey="income" name="Pemasukan" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400">
              <p>Belum ada data transaksi</p>
            </div>
          )}
        </div>

        {/* Category Spending Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pengeluaran per Kategori</h3>
          {data.categorySpending.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.categorySpending}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="total"
                  nameKey="name"
                >
                  {data.categorySpending.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(value: any) => formatRupiah(Number(value))} />
                <Legend
                  formatter={(value) => {
                    const cat = data.categorySpending.find((c) => c.name === value)
                    return `${cat?.icon || ""} ${value}`
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400">
              <p>Belum ada data pengeluaran</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Transaksi Terbaru</h3>
          <a href="/transactions" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Lihat semua
          </a>
        </div>

        {data.recentTransactions.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {data.recentTransactions.map((tx) => (
              <div key={tx._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${tx.type === "income" ? "bg-green-50" : tx.type === "expense" ? "bg-red-50" : "bg-blue-50"}`}
                >
                  {tx.type === "income" ? (
                    <ArrowDownLeft size={20} className="text-green-600" />
                  ) : tx.type === "expense" ? (
                    <ArrowUpRight size={20} className="text-red-600" />
                  ) : (
                    <ArrowLeftRight size={20} className="text-blue-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {tx.description || (tx.categoryId?.name ?? "Transfer")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {tx.accountId?.name} •{" "}
                    {format(new Date(tx.date), "dd MMM yyyy", { locale: id })}
                  </p>
                </div>

                <span
                  className={`font-semibold text-right flex-shrink-0
                    ${tx.type === "income" ? "text-green-600" : tx.type === "expense" ? "text-red-600" : "text-blue-600"}`}
                >
                  {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                  {formatRupiah(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400">
            <ArrowLeftRight size={40} className="mx-auto mb-3 opacity-30" />
            <p>Belum ada transaksi</p>
          </div>
        )}
      </div>
    </div>
  )
}
