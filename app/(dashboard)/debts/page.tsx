"use client"

import { useEffect, useState } from "react"
import {
  Plus, Edit2, Trash2, Loader2, HandCoins, TrendingDown, TrendingUp, AlertCircle,
  ChevronDown, CheckCircle2, Clock, CircleDot,
} from "lucide-react"
import Modal from "@/components/Modal"
import { useToast } from "@/components/Toast"
import { useConfirm } from "@/components/ConfirmDialog"
import { format, differenceInDays } from "date-fns"
import { id as idLocale } from "date-fns/locale"

interface Debt {
  _id: string
  type: "debt" | "receivable"
  personName: string
  amount: number
  paidAmount: number
  date: string
  dueDate: string | null
  status: "unpaid" | "partial" | "paid"
  description: string
  notes: string
  createdAt: string
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

const statusConfig = {
  unpaid: { label: "Belum Lunas", color: "bg-red-100 text-red-700", icon: CircleDot },
  partial: { label: "Sebagian", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  paid: { label: "Lunas", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
}

const emptyForm = {
  type: "debt" as "debt" | "receivable",
  personName: "",
  amount: "",
  paidAmount: "0",
  date: format(new Date(), "yyyy-MM-dd"),
  dueDate: "",
  status: "unpaid" as "unpaid" | "partial" | "paid",
  description: "",
  notes: "",
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<"all" | "debt" | "receivable">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "unpaid" | "partial" | "paid">("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [payAmount, setPayAmount] = useState("")
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const { confirm } = useConfirm()

  useEffect(() => {
    fetchDebts()
  }, [])

  async function fetchDebts() {
    try {
      const res = await fetch("/api/debts")
      const data = await res.json()
      setDebts(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingDebt(null)
    setForm(emptyForm)
    setError("")
    setModalOpen(true)
  }

  function openEdit(debt: Debt) {
    setEditingDebt(debt)
    setForm({
      type: debt.type,
      personName: debt.personName,
      amount: String(debt.amount),
      paidAmount: String(debt.paidAmount),
      date: format(new Date(debt.date), "yyyy-MM-dd"),
      dueDate: debt.dueDate ? format(new Date(debt.dueDate), "yyyy-MM-dd") : "",
      status: debt.status,
      description: debt.description,
      notes: debt.notes,
    })
    setError("")
    setModalOpen(true)
  }

  function openPayModal(debt: Debt) {
    setSelectedDebt(debt)
    setPayAmount("")
    setPayModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    const amount = parseFloat(form.amount)
    const paidAmount = parseFloat(form.paidAmount) || 0

    let status: "unpaid" | "partial" | "paid"
    if (paidAmount <= 0) status = "unpaid"
    else if (paidAmount >= amount) status = "paid"
    else status = "partial"

    const payload = {
      type: form.type,
      personName: form.personName,
      amount,
      paidAmount,
      date: form.date,
      dueDate: form.dueDate || null,
      status,
      description: form.description,
      notes: form.notes,
    }

    try {
      let res: Response
      if (editingDebt) {
        res = await fetch(`/api/debts/${editingDebt._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch("/api/debts", {
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

      await fetchDebts()
      setModalOpen(false)
      toast(editingDebt ? "Data berhasil diperbarui" : "Catatan berhasil ditambahkan")
    } catch {
      setError("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDebt) return
    setSaving(true)

    const addPaid = parseFloat(payAmount)
    const newPaid = Math.min(selectedDebt.paidAmount + addPaid, selectedDebt.amount)
    const newStatus: "unpaid" | "partial" | "paid" =
      newPaid >= selectedDebt.amount ? "paid" : newPaid > 0 ? "partial" : "unpaid"

    try {
      const res = await fetch(`/api/debts/${selectedDebt._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedDebt.type,
          personName: selectedDebt.personName,
          amount: selectedDebt.amount,
          paidAmount: newPaid,
          date: selectedDebt.date,
          dueDate: selectedDebt.dueDate,
          status: newStatus,
          description: selectedDebt.description,
          notes: selectedDebt.notes,
        }),
      })

      if (res.ok) {
        await fetchDebts()
        setPayModalOpen(false)
        toast(newStatus === "paid" ? "Lunas! Pembayaran berhasil dicatat" : "Pembayaran berhasil dicatat")
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ title: "Hapus Catatan", message: "Catatan hutang/piutang ini akan dihapus permanen. Lanjutkan?", confirmText: "Hapus" })
    if (!ok) return
    setDeleting(id)
    try {
      await fetch(`/api/debts/${id}`, { method: "DELETE" })
      setDebts((prev) => prev.filter((d) => d._id !== id))
      toast("Catatan berhasil dihapus")
    } finally {
      setDeleting(null)
    }
  }

  const filtered = debts.filter((d) => {
    if (filterType !== "all" && d.type !== filterType) return false
    if (filterStatus !== "all" && d.status !== filterStatus) return false
    return true
  })

  const totalDebt = debts.filter((d) => d.type === "debt").reduce((s, d) => s + (d.amount - d.paidAmount), 0)
  const totalReceivable = debts.filter((d) => d.type === "receivable").reduce((s, d) => s + (d.amount - d.paidAmount), 0)
  const overdue = debts.filter((d) => {
    if (d.status === "paid" || !d.dueDate) return false
    return differenceInDays(new Date(d.dueDate), new Date()) < 0
  }).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Hutang</p>
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown size={18} className="text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatRupiah(totalDebt)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {debts.filter((d) => d.type === "debt" && d.status !== "paid").length} aktif
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Piutang</p>
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={18} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatRupiah(totalReceivable)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {debts.filter((d) => d.type === "receivable" && d.status !== "paid").length} aktif
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Jatuh Tempo</p>
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertCircle size={18} className="text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-600">{overdue}</p>
          <p className="text-xs text-gray-400 mt-1">belum lunas &amp; terlambat</p>
        </div>
      </div>

      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Semua Tipe</option>
              <option value="debt">Hutang Saya</option>
              <option value="receivable">Piutang</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="unpaid">Belum Lunas</option>
              <option value="partial">Sebagian</option>
              <option value="paid">Lunas</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition font-medium text-sm"
        >
          <Plus size={18} />
          Tambah Catatan
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <HandCoins size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 font-medium">Tidak ada data hutang/piutang</p>
          <p className="text-gray-400 text-sm mt-1">Catat hutang atau piutang untuk melacak keuangan lebih baik</p>
          <button
            onClick={openCreate}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium"
          >
            Tambah Catatan Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((debt) => {
            const remaining = debt.amount - debt.paidAmount
            const progress = debt.amount > 0 ? (debt.paidAmount / debt.amount) * 100 : 0
            const StatusIcon = statusConfig[debt.status].icon
            const isOverdue = debt.dueDate && debt.status !== "paid" &&
              differenceInDays(new Date(debt.dueDate), new Date()) < 0
            const daysLeft = debt.dueDate ? differenceInDays(new Date(debt.dueDate), new Date()) : null

            return (
              <div
                key={debt._id}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition
                  ${debt.status === "paid" ? "border-green-100 opacity-75" : isOverdue ? "border-red-200" : "border-gray-100"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: icon + info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                      ${debt.type === "debt" ? "bg-red-100" : "bg-green-100"}`}>
                      {debt.type === "debt"
                        ? <TrendingDown size={20} className="text-red-600" />
                        : <TrendingUp size={20} className="text-green-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800">{debt.personName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${debt.type === "debt" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                          {debt.type === "debt" ? "Hutang Saya" : "Piutang"}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${statusConfig[debt.status].color}`}>
                          <StatusIcon size={11} />
                          {statusConfig[debt.status].label}
                        </span>
                      </div>

                      {debt.description && (
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{debt.description}</p>
                      )}

                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                        <span>{format(new Date(debt.date), "dd MMM yyyy", { locale: idLocale })}</span>
                        {debt.dueDate && (
                          <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : ""}`}>
                            <Clock size={11} />
                            {isOverdue
                              ? `Terlambat ${Math.abs(daysLeft!)} hari`
                              : daysLeft === 0
                              ? "Jatuh tempo hari ini"
                              : `Jatuh tempo ${format(new Date(debt.dueDate), "dd MMM yyyy", { locale: idLocale })}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: amount + actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-gray-800 text-lg leading-none">{formatRupiah(debt.amount)}</p>
                      {debt.status !== "paid" && (
                        <p className="text-xs text-gray-400 mt-0.5">Sisa: {formatRupiah(remaining)}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {debt.status !== "paid" && (
                        <button
                          onClick={() => openPayModal(debt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
                            ${debt.type === "debt"
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                        >
                          {debt.type === "debt" ? "Bayar" : "Terima"}
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(debt)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(debt._id)}
                        disabled={deleting === debt._id}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                      >
                        {deleting === debt._id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress bar for partial/paid */}
                {debt.paidAmount > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Dibayar: {formatRupiah(debt.paidAmount)}</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${debt.status === "paid" ? "bg-green-500" : "bg-blue-500"}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {debt.notes && (
                  <p className="mt-3 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 italic">{debt.notes}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDebt ? "Edit Hutang/Piutang" : "Tambah Hutang/Piutang"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* Type toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "debt" })}
                className={`py-2.5 rounded-lg font-medium text-sm transition border-2
                  ${form.type === "debt"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
              >
                Hutang Saya
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "receivable" })}
                className={`py-2.5 rounded-lg font-medium text-sm transition border-2
                  ${form.type === "receivable"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
              >
                Piutang
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {form.type === "debt" ? "Nama Pemberi Hutang" : "Nama Peminjam"}
            </label>
            <input
              type="text"
              required
              value={form.personName}
              onChange={(e) => setForm({ ...form, personName: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nama orang"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sudah Dibayar (Rp)</label>
              <input
                type="number"
                min="0"
                value={form.paidAmount}
                onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo (opsional)</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan (opsional)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: hutang beli laptop"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Catatan tambahan..."
            />
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
              {saving && <Loader2 size={18} className="animate-spin" />}
              {editingDebt ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Pay/Receive Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={selectedDebt?.type === "debt" ? "Catat Pembayaran" : "Catat Penerimaan"}
        size="sm"
      >
        {selectedDebt && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">{selectedDebt.personName}</p>
              <p className="font-bold text-gray-800">{formatRupiah(selectedDebt.amount)}</p>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Sudah dibayar: {formatRupiah(selectedDebt.paidAmount)}</span>
                <span>Sisa: {formatRupiah(selectedDebt.amount - selectedDebt.paidAmount)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(selectedDebt.paidAmount / selectedDebt.amount) * 100}%` }}
                />
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah {selectedDebt.type === "debt" ? "Pembayaran" : "Penerimaan"} (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedDebt.amount - selectedDebt.paidAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setPayAmount(String(selectedDebt.amount - selectedDebt.paidAmount))}
                  className="mt-1.5 text-xs text-blue-600 hover:underline"
                >
                  Bayar lunas ({formatRupiah(selectedDebt.amount - selectedDebt.paidAmount)})
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={18} className="animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  )
}
