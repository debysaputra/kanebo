"use client"

import { useEffect, useState } from "react"
import { Plus, Edit2, Trash2, TrendingUp, Loader2, CheckCircle, Clock } from "lucide-react"
import Modal from "@/components/Modal"
import { format, differenceInDays } from "date-fns"
import { id as idLocale } from "date-fns/locale"

interface Goal {
  _id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
  color: string
  icon: string
  createdAt: string
}

const goalColors = [
  "#3B82F6", "#22C55E", "#EF4444", "#F59E0B", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#0EA5E9", "#10B981",
]

const goalIcons = [
  "🎯", "🏠", "🚗", "✈️", "💍", "📱", "💻", "🎓",
  "🏖️", "💰", "🏋️", "🎵", "🛒", "🐶", "👶", "🌟",
]

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [addFundsModal, setAddFundsModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
    color: "#3B82F6",
    icon: "🎯",
  })
  const [addFundsAmount, setAddFundsAmount] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchGoals()
  }, [])

  async function fetchGoals() {
    try {
      const res = await fetch("/api/goals")
      const data = await res.json()
      setGoals(data)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingGoal(null)
    setForm({
      name: "",
      targetAmount: "",
      currentAmount: "0",
      deadline: "",
      color: "#3B82F6",
      icon: "🎯",
    })
    setError("")
    setModalOpen(true)
  }

  function openEdit(goal: Goal) {
    setEditingGoal(goal)
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      deadline: goal.deadline ? format(new Date(goal.deadline), "yyyy-MM-dd") : "",
      color: goal.color,
      icon: goal.icon,
    })
    setError("")
    setModalOpen(true)
  }

  function openAddFunds(goal: Goal) {
    setEditingGoal(goal)
    setAddFundsAmount("")
    setAddFundsModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const payload = {
        name: form.name,
        targetAmount: parseFloat(form.targetAmount),
        currentAmount: parseFloat(form.currentAmount) || 0,
        deadline: form.deadline || null,
        color: form.color,
        icon: form.icon,
      }

      let res: Response
      if (editingGoal) {
        res = await fetch(`/api/goals/${editingGoal._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch("/api/goals", {
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

      await fetchGoals()
      setModalOpen(false)
    } catch {
      setError("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleAddFunds(e: React.FormEvent) {
    e.preventDefault()
    if (!editingGoal) return
    setSaving(true)

    const amount = parseFloat(addFundsAmount)
    const newAmount = editingGoal.currentAmount + amount

    try {
      const res = await fetch(`/api/goals/${editingGoal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingGoal.name,
          targetAmount: editingGoal.targetAmount,
          currentAmount: newAmount,
          deadline: editingGoal.deadline,
          color: editingGoal.color,
          icon: editingGoal.icon,
        }),
      })

      if (res.ok) {
        await fetchGoals()
        setAddFundsModal(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus tujuan ini?")) return
    setDeleting(id)
    try {
      await fetch(`/api/goals/${id}`, { method: "DELETE" })
      setGoals((prev) => prev.filter((g) => g._id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const completedGoals = goals.filter((g) => g.currentAmount >= g.targetAmount).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Tujuan</p>
            <p className="text-2xl font-bold text-blue-600">{goals.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Tujuan Tercapai</p>
            <p className="text-2xl font-bold text-green-600">{completedGoals}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Terkumpul</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatRupiah(goals.reduce((sum, g) => sum + g.currentAmount, 0))}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Daftar Tujuan Keuangan</h3>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition font-medium text-sm"
        >
          <Plus size={18} />
          Tambah Tujuan
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <TrendingUp size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 font-medium">Belum ada tujuan keuangan</p>
          <p className="text-gray-400 text-sm mt-1">Tetapkan tujuan menabung untuk masa depan yang lebih baik</p>
          <button
            onClick={openCreate}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium"
          >
            Buat Tujuan Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
            const isCompleted = goal.currentAmount >= goal.targetAmount
            const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null
            const isOverdue = daysLeft !== null && daysLeft < 0 && !isCompleted

            return (
              <div
                key={goal._id}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition
                  ${isCompleted ? "border-green-200 bg-green-50/30" : "border-gray-100"}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: goal.color + "20" }}
                    >
                      {goal.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{goal.name}</p>
                      {isCompleted ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle size={12} /> Tercapai!
                        </span>
                      ) : goal.deadline ? (
                        <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-500" : "text-gray-500"}`}>
                          <Clock size={12} />
                          {isOverdue
                            ? `Terlambat ${Math.abs(daysLeft!)} hari`
                            : `${daysLeft} hari lagi (${format(new Date(goal.deadline), "dd MMM yyyy", { locale: idLocale })})`}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Tanpa batas waktu</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(goal)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(goal._id)}
                      disabled={deleting === goal._id}
                      className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                    >
                      {deleting === goal._id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-800">{formatRupiah(goal.currentAmount)}</span>
                    <span className="text-gray-500">Target: {formatRupiah(goal.targetAmount)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: isCompleted ? "#22C55E" : goal.color,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-400">{percentage.toFixed(1)}% tercapai</span>
                    <span className="text-gray-400">
                      Kekurangan: {formatRupiah(Math.max(0, goal.targetAmount - goal.currentAmount))}
                    </span>
                  </div>
                </div>

                {/* Add funds button */}
                {!isCompleted && (
                  <button
                    onClick={() => openAddFunds(goal)}
                    className="w-full py-2 border-2 border-dashed rounded-xl text-sm font-medium transition"
                    style={{ borderColor: goal.color, color: goal.color }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = goal.color + "10"
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = "transparent"
                    }}
                  >
                    + Tambah Dana
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Goal Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGoal ? "Edit Tujuan" : "Tambah Tujuan Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tujuan</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: Beli Rumah, Liburan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Tabungan (Rp)</label>
            <input
              type="number"
              required
              min="1"
              value={form.targetAmount}
              onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dana Saat Ini (Rp)</label>
            <input
              type="number"
              min="0"
              value={form.currentAmount}
              onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batas Waktu (opsional)
            </label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ikon</label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
              {goalIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm({ ...form, icon })}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition
                    ${form.icon === icon ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Warna</label>
            <div className="flex flex-wrap gap-2">
              {goalColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`w-7 h-7 rounded-full border-2 transition
                    ${form.color === color ? "border-gray-800 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
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
              {editingGoal ? "Simpan" : "Buat Tujuan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Funds Modal */}
      <Modal
        isOpen={addFundsModal}
        onClose={() => setAddFundsModal(false)}
        title="Tambah Dana"
        size="sm"
      >
        {editingGoal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: editingGoal.color + "20" }}
              >
                {editingGoal.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{editingGoal.name}</p>
                <p className="text-sm text-gray-500">
                  Terkumpul: {formatRupiah(editingGoal.currentAmount)} / {formatRupiah(editingGoal.targetAmount)}
                </p>
              </div>
            </div>

            <form onSubmit={handleAddFunds} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Dana (Rp)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={addFundsAmount}
                  onChange={(e) => setAddFundsAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAddFundsModal(false)}
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
                  Tambahkan
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  )
}
