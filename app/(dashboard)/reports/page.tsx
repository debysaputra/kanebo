"use client"

import { useEffect, useState } from "react"
import { Loader2, TrendingUp, TrendingDown } from "lucide-react"
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
  LineChart,
  Line,
} from "recharts"

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
const MONTH_NAMES_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatRupiahShort(amount: number) {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}jt`
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}rb`
  return String(amount)
}

export default function ReportsPage() {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [monthlyData, setMonthlyData] = useState<{ month: string; income: number; expense: number; savings: number }[]>([])
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([])
  const [incomeCategories, setIncomeCategories] = useState<CategorySpending[]>([])
  const [loading, setLoading] = useState(true)

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  useEffect(() => {
    fetchData()
  }, [selectedYear, selectedMonth])

  async function fetchData() {
    setLoading(true)
    try {
      // Fetch full year dashboard
      const promises = Array.from({ length: 12 }, (_, i) =>
        fetch(`/api/dashboard?month=${i + 1}&year=${selectedYear}`).then((r) => r.json())
      )
      const monthlyResults = await Promise.all(promises)

      const monthly = monthlyResults.map((data, i) => ({
        month: MONTH_NAMES[i],
        income: data.income || 0,
        expense: data.expense || 0,
        savings: (data.income || 0) - (data.expense || 0),
      }))
      setMonthlyData(monthly)

      // Current month details
      const currentData = monthlyResults[selectedMonth - 1]
      setCategoryData(currentData.categorySpending || [])

      // Income categories for current month
      const incomeRes = await fetch(`/api/transactions?type=income&page=1&limit=1000`)
      const incomeData = await incomeRes.json()

      // Aggregate income by category
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const incomeMap: Record<string, any> = {}
      for (const tx of (incomeData.transactions || [])) {
        if (!tx.categoryId) continue
        const catId = tx.categoryId._id
        const txDate = new Date(tx.date)
        if (txDate.getMonth() + 1 === selectedMonth && txDate.getFullYear() === selectedYear) {
          if (!incomeMap[catId]) {
            incomeMap[catId] = { ...tx.categoryId, total: 0 }
          }
          incomeMap[catId].total += tx.amount
        }
      }
      setIncomeCategories(Object.values(incomeMap))
    } finally {
      setLoading(false)
    }
  }

  const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0)
  const totalExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0)
  const currentMonthData = monthlyData[selectedMonth - 1]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Year / Month Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
        >
          {MONTH_NAMES_FULL.map((m, i) => (
            <option key={i + 1} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Year Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-xl">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pemasukan {selectedYear}</p>
              <p className="text-xl font-bold text-green-600">{formatRupiah(totalIncome)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-xl">
              <TrendingDown size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pengeluaran {selectedYear}</p>
              <p className="text-xl font-bold text-red-600">{formatRupiah(totalExpense)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${totalIncome - totalExpense >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
              <TrendingUp size={20} className={totalIncome - totalExpense >= 0 ? "text-blue-600" : "text-orange-600"} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tabungan Bersih {selectedYear}</p>
              <p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                {formatRupiah(totalIncome - totalExpense)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Tren Bulanan {selectedYear}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={formatRupiahShort} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => formatRupiah(Number(value))}
              contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
            />
            <Legend />
            <Bar dataKey="income" name="Pemasukan" fill="#22C55E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Pengeluaran" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Savings Line Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tren Tabungan {selectedYear}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={formatRupiahShort} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => formatRupiah(Number(value))}
              contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
            />
            <Line
              type="monotone"
              dataKey="savings"
              name="Tabungan"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ fill: "#3B82F6", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Expense Pie */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Pengeluaran per Kategori
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {MONTH_NAMES_FULL[selectedMonth - 1]} {selectedYear}
            {currentMonthData && (
              <span className="ml-2 font-medium text-red-600">
                {formatRupiah(currentMonthData.expense)}
              </span>
            )}
          </p>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="total"
                  nameKey="name"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(value: any) => formatRupiah(Number(value))} />
                <Legend
                  formatter={(value) => {
                    const cat = categoryData.find((c) => c.name === value)
                    return `${cat?.icon || ""} ${value}`
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400">
              <p>Tidak ada data pengeluaran</p>
            </div>
          )}
        </div>

        {/* Income Pie */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Pemasukan per Kategori
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {MONTH_NAMES_FULL[selectedMonth - 1]} {selectedYear}
            {currentMonthData && (
              <span className="ml-2 font-medium text-green-600">
                {formatRupiah(currentMonthData.income)}
              </span>
            )}
          </p>
          {incomeCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={incomeCategories}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="total"
                  nameKey="name"
                >
                  {incomeCategories.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(value: any) => formatRupiah(Number(value))} />
                <Legend
                  formatter={(value) => {
                    const cat = incomeCategories.find((c) => c.name === value)
                    return `${cat?.icon || ""} ${value}`
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400">
              <p>Tidak ada data pemasukan</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Detail Table */}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">
              Detail Pengeluaran — {MONTH_NAMES_FULL[selectedMonth - 1]} {selectedYear}
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {categoryData.map((cat) => {
              const pct = currentMonthData?.expense > 0 ? (cat.total / currentMonthData.expense) * 100 : 0
              return (
                <div key={cat._id} className="flex items-center gap-4 px-5 py-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: cat.color + "20" }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <p className="font-medium text-gray-800 text-sm">{cat.name}</p>
                      <p className="font-semibold text-red-600 text-sm">{formatRupiah(cat.total)}</p>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{pct.toFixed(1)}% dari total pengeluaran</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
