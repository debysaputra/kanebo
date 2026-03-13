"use client"

import { useEffect, useState } from "react"
import { Plus, Edit2, Trash2, Target, Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import Modal from "@/components/Modal"

interface Budget {
  _id: string
  amount: number
  spent: number
  month: number
  year: number
  categoryId: {
    _id: string
    name: string
    color: string
    icon: string
  }
}

interface Category {
  _id: string
  name: string
  type: string
  color: string
  icon: string
}

const MONTHS = [
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

export default function BudgetsPage() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [form, setForm] = useState({
    categoryId: "",
    amount: "",
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchBudgets()
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetch("/api/categories?type=expense")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
  }, [])

  async function fetchBudgets() {
    setLoading(true)
    try {
      const res = await fetch(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`)
      const data = await res.json()
      setBudgets(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingBudget(null)
    setForm({
      categoryId: "",
      amount: "",
      month: String(selectedMonth),
      year: String(selectedYear),
    })
    setError("")
    setModalOpen(true)
  }

  function openEdit(budget: Budget) {
    setEditingBudget(budget)
    setForm({
      categoryId: budget.categoryId._id,
      amount: String(budget.amount),
      month: String(budget.month),
      year: String(budget.year),
    })
    setError("")
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const payload = {
        categoryId: form.categoryId,
        amount: parseFloat(form.amount),
        month: parseInt(form.month),
        year: parseInt(form.year),
      }

      let res: Response
      if (editingBudget) {
        res = await fetch(`/api/budgets/${editingBudget._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: payload.amount }),
        })
      } else {
        res = await fetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan")
        return
      }

      await fetchBudgets()
      setModalOpen(false)
    } catch {
      setError("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus anggaran ini?")) return
    setDeleting(id)
    try {
      await fetch(`/api/budgets/${id}`, { method: "DELETE" })
      setBudgets((prev) => prev.filter((b) => b._id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const overBudgetCount = budgets.filter((b) => b.spent > b.amount).length

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  return (
    <div className="space-y-6">
      {/* Month/Year Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
        >
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>
              {m}
            </option>
          ))}
        </select>

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
      </div>

      {/* Summary Cards */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Anggaran</p>
            <p className="text-2xl font-bold text-blue-600">{formatRupiah(totalBudget)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Terpakai</p>
            <p className="text-2xl font-bold text-red-600">{formatRupiah(totalSpent)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Sisa Anggaran</p>
            <p className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatRupiah(totalBudget - totalSpent)}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Anggaran {MONTHS[selectedMonth - 1]} {selectedYear}</h3>
          {overBudgetCount > 0 && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-0.5">
              <AlertTriangle size={14} />
              {overBudgetCount} anggaran melebihi batas
            </p>
          )}
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition font-medium text-sm"
        >
          <Plus size={18} />
          Tambah
        </button>
      </div>

      {/* Budget Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Target size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 font-medium">Belum ada anggaran</p>
          <p className="text-gray-400 text-sm mt-1">Atur anggaran bulanan untuk mengontrol pengeluaran</p>
          <button
            onClick={openCreate}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium"
          >
            Buat Anggaran Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0
            const isOver = budget.spent > budget.amount
            const isWarning = percentage >= 80 && !isOver

            return (
              <div
                key={budget._id}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition
                  ${isOver ? "border-red-200" : "border-gray-100"}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: budget.categoryId.color + "20" }}
                    >
                      {budget.categoryId.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{budget.categoryId.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {isOver ? (
                          <span className="text-xs text-red-500 flex items-center gap-1">
                            <AlertTriangle size={12} /> Melebihi anggaran
                          </span>
                        ) : isWarning ? (
                          <span className="text-xs text-orange-500 flex items-center gap-1">
                            <AlertTriangle size={12} /> Hampir habis
                          </span>
                        ) : (
                          <span className="text-xs text-green-500 flex items-center gap-1">
                            <CheckCircle size={12} /> Terkendali
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(budget)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(budget._id)}
                      disabled={deleting === budget._id}
                      className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                    >
                      {deleting === budget._id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">
                      Terpakai: <span className="font-medium text-gray-800">{formatRupiah(budget.spent)}</span>
                    </span>
                    <span className="text-gray-500">
                      Anggaran: <span className="font-medium text-gray-800">{formatRupiah(budget.amount)}</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? "bg-red-500" : isWarning ? "bg-orange-400" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className={isOver ? "text-red-500" : "text-gray-400"}>
                      {percentage.toFixed(0)}% terpakai
                    </span>
                    <span className={budget.amount - budget.spent >= 0 ? "text-green-600" : "text-red-500"}>
                      Sisa: {formatRupiah(budget.amount - budget.spent)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBudget ? "Edit Anggaran" : "Tambah Anggaran"}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          {!editingBudget && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                required
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Pilih kategori</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Anggaran (Rp)</label>
            <input
              type="number"
              required
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          {!editingBudget && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                <select
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                <select
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : null}
              {editingBudget ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
