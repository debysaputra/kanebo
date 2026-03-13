"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Modal from "@/components/Modal"
import { useToast } from "@/components/Toast"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

interface Transaction {
  _id: string
  type: "income" | "expense" | "transfer"
  amount: number
  description: string
  date: string
  accountId: { _id: string; name: string; color: string; icon: string }
  categoryId: { _id: string; name: string; color: string; icon: string } | null
  transferToAccountId: { _id: string; name: string; color: string; icon: string } | null
}

interface Account {
  _id: string
  name: string
  type: string
  color: string
  icon: string
}

interface Category {
  _id: string
  name: string
  type: string
  color: string
  icon: string
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const [filterType, setFilterType] = useState("all")
  const [filterAccount, setFilterAccount] = useState("")
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [form, setForm] = useState({
    type: "expense",
    accountId: "",
    categoryId: "",
    transferToAccountId: "",
    amount: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(filterType !== "all" && { type: filterType }),
        ...(filterAccount && { accountId: filterAccount }),
        ...(filterStartDate && { startDate: filterStartDate }),
        ...(filterEndDate && { endDate: filterEndDate }),
        ...(search && { search }),
      })

      const res = await fetch(`/api/transactions?${params}`)
      const data = await res.json()
      setTransactions(data.transactions || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } finally {
      setLoading(false)
    }
  }, [page, filterType, filterAccount, filterStartDate, filterEndDate, search])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    fetch("/api/accounts").then((r) => r.json()).then((d) => setAccounts(Array.isArray(d) ? d : []))
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(Array.isArray(d) ? d : []))
  }, [])

  const filteredCategories = categories.filter(
    (c) => form.type === "transfer" || c.type === form.type
  )

  function openCreate() {
    setEditingTx(null)
    setForm({
      type: "expense",
      accountId: accounts[0]?._id || "",
      categoryId: "",
      transferToAccountId: "",
      amount: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
    })
    setError("")
    setModalOpen(true)
  }

  function openEdit(tx: Transaction) {
    setEditingTx(tx)
    setForm({
      type: tx.type,
      accountId: tx.accountId._id,
      categoryId: tx.categoryId?._id || "",
      transferToAccountId: tx.transferToAccountId?._id || "",
      amount: String(tx.amount),
      description: tx.description,
      date: format(new Date(tx.date), "yyyy-MM-dd"),
    })
    setError("")
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) {
      setError("Jumlah harus lebih dari 0")
      setSaving(false)
      return
    }

    try {
      const payload = {
        type: form.type,
        accountId: form.accountId,
        categoryId: form.categoryId || null,
        transferToAccountId: form.type === "transfer" ? form.transferToAccountId : null,
        amount,
        description: form.description,
        date: form.date,
      }

      let res: Response
      if (editingTx) {
        res = await fetch(`/api/transactions/${editingTx._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch("/api/transactions", {
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

      setModalOpen(false)
      fetchTransactions()
      toast(editingTx ? "Transaksi berhasil diperbarui" : "Transaksi berhasil ditambahkan")
    } catch {
      setError("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return
    setDeleting(id)
    try {
      await fetch(`/api/transactions/${id}`, { method: "DELETE" })
      fetchTransactions()
      toast("Transaksi berhasil dihapus")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(searchInput)
                  setPage(1)
                }
              }}
              placeholder="Cari transaksi..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">Semua Tipe</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
            <option value="transfer">Transfer</option>
          </select>

          {/* Account Filter */}
          <select
            value={filterAccount}
            onChange={(e) => { setFilterAccount(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Semua Akun</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.icon} {a.name}
              </option>
            ))}
          </select>

          {/* Date filters */}
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => { setFilterStartDate(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => { setFilterEndDate(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => {
              setFilterType("all")
              setFilterAccount("")
              setFilterStartDate("")
              setFilterEndDate("")
              setSearch("")
              setSearchInput("")
              setPage(1)
            }}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <Filter size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {total} transaksi ditemukan
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition font-medium text-sm"
        >
          <Plus size={18} />
          Tambah
        </button>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ArrowLeftRight size={40} className="mx-auto mb-3 opacity-30" />
            <p>Tidak ada transaksi</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <div key={tx._id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition group">
                {/* Type icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${tx.type === "income" ? "bg-green-50" : tx.type === "expense" ? "bg-red-50" : "bg-blue-50"}`}
                >
                  {tx.type === "income" ? (
                    <ArrowDownLeft size={18} className="text-green-600" />
                  ) : tx.type === "expense" ? (
                    <ArrowUpRight size={18} className="text-red-600" />
                  ) : (
                    <ArrowLeftRight size={18} className="text-blue-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800 truncate">
                      {tx.description || tx.categoryId?.name || "Transfer"}
                    </p>
                    {tx.categoryId && (
                      <span
                        className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: tx.categoryId.color + "20",
                          color: tx.categoryId.color,
                        }}
                      >
                        {tx.categoryId.icon} {tx.categoryId.name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mr-2"
                      style={{ backgroundColor: tx.accountId.color + "20", color: tx.accountId.color }}
                    >
                      {tx.accountId.icon} {tx.accountId.name}
                    </span>
                    {tx.type === "transfer" && tx.transferToAccountId && (
                      <span className="text-xs text-gray-400 mr-2">
                        → {tx.transferToAccountId.icon} {tx.transferToAccountId.name}
                      </span>
                    )}
                    {format(new Date(tx.date), "dd MMM yyyy", { locale: idLocale })}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p
                    className={`font-semibold ${
                      tx.type === "income" ? "text-green-600" :
                      tx.type === "expense" ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                    {formatRupiah(tx.amount)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => openEdit(tx)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(tx._id)}
                    disabled={deleting === tx._id}
                    className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                  >
                    {deleting === tx._id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTx ? "Edit Transaksi" : "Tambah Transaksi"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Transaksi</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "income", label: "Pemasukan", color: "green" },
                { value: "expense", label: "Pengeluaran", color: "red" },
                { value: "transfer", label: "Transfer", color: "blue" },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: t.value, categoryId: "" })}
                  className={`py-2.5 rounded-lg text-sm font-medium border-2 transition
                    ${form.type === t.value
                      ? t.color === "green"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : t.color === "red"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {form.type === "transfer" ? "Akun Asal" : "Akun"}
            </label>
            <select
              required
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="">Pilih akun</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.icon} {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Transfer To Account */}
          {form.type === "transfer" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Akun Tujuan</label>
              <select
                required
                value={form.transferToAccountId}
                onChange={(e) => setForm({ ...form, transferToAccountId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              >
                <option value="">Pilih akun tujuan</option>
                {accounts
                  .filter((a) => a._id !== form.accountId)
                  .map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.icon} {a.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Category (not for transfer) */}
          {form.type !== "transfer" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              >
                <option value="">Tanpa kategori</option>
                {filteredCategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
            <input
              type="number"
              required
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="0"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (opsional)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Catatan transaksi"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
              {saving ? <Loader2 size={18} className="animate-spin" /> : null}
              {editingTx ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
