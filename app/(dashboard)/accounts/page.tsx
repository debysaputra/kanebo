"use client"

import { useEffect, useState } from "react"
import { Plus, Edit2, Trash2, Wallet, Loader2, CreditCard, Smartphone, Banknote } from "lucide-react"
import Modal from "@/components/Modal"

interface Account {
  _id: string
  name: string
  type: "cash" | "bank" | "ewallet" | "credit"
  balance: number
  color: string
  icon: string
  isActive: boolean
}

const accountTypes = [
  { value: "cash", label: "Tunai", icon: Banknote },
  { value: "bank", label: "Bank", icon: Wallet },
  { value: "ewallet", label: "E-Wallet", icon: Smartphone },
  { value: "credit", label: "Kartu Kredit", icon: CreditCard },
]

const accountColors = [
  "#3B82F6", "#22C55E", "#EF4444", "#F59E0B", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6B7280", "#0EA5E9",
]

const accountIcons = ["💳", "🏦", "💰", "👛", "📱", "💵", "🏧", "💎", "🏠", "💼"]

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

function AccountTypeIcon({ type }: { type: string }) {
  const found = accountTypes.find((t) => t.value === type)
  if (!found) return <Wallet size={18} />
  const Icon = found.icon
  return <Icon size={18} />
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    type: "cash",
    balance: "",
    color: "#3B82F6",
    icon: "💳",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAccounts()
  }, [])

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/accounts")
      const data = await res.json()
      setAccounts(data)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingAccount(null)
    setForm({ name: "", type: "cash", balance: "", color: "#3B82F6", icon: "💳" })
    setError("")
    setModalOpen(true)
  }

  function openEdit(account: Account) {
    setEditingAccount(account)
    setForm({
      name: account.name,
      type: account.type,
      balance: String(account.balance),
      color: account.color,
      icon: account.icon,
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
        name: form.name,
        type: form.type,
        balance: parseFloat(form.balance) || 0,
        color: form.color,
        icon: form.icon,
      }

      let res: Response
      if (editingAccount) {
        res = await fetch(`/api/accounts/${editingAccount._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch("/api/accounts", {
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

      await fetchAccounts()
      setModalOpen(false)
    } catch {
      setError("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus akun ini?")) return
    setDeleting(id)
    try {
      await fetch(`/api/accounts/${id}`, { method: "DELETE" })
      setAccounts((prev) => prev.filter((a) => a._id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <p className="text-blue-100 text-sm mb-1">Total Saldo Semua Akun</p>
        <p className="text-4xl font-bold">{formatRupiah(totalBalance)}</p>
        <p className="text-blue-200 text-sm mt-2">{accounts.length} akun aktif</p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Daftar Akun</h3>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition font-medium text-sm"
        >
          <Plus size={18} />
          Tambah Akun
        </button>
      </div>

      {/* Account Grid */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Wallet size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 font-medium">Belum ada akun</p>
          <p className="text-gray-400 text-sm mt-1">Tambahkan akun untuk mulai mencatat keuangan</p>
          <button
            onClick={openCreate}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium"
          >
            Tambah Akun Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition"
            >
              {/* Color bar */}
              <div className="h-2" style={{ backgroundColor: account.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: account.color + "20" }}
                    >
                      {account.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{account.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <AccountTypeIcon type={account.type} />
                        {accountTypes.find((t) => t.value === account.type)?.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(account)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(account._id)}
                      disabled={deleting === account._id}
                      className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition"
                    >
                      {deleting === account._id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">Saldo</p>
                  <p
                    className="text-xl font-bold"
                    style={{ color: account.balance < 0 ? "#EF4444" : account.color }}
                  >
                    {formatRupiah(account.balance)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAccount ? "Edit Akun" : "Tambah Akun Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Akun</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Contoh: BCA, OVO, Dompet"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Akun</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
            >
              {accountTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Awal</label>
            <input
              type="number"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ikon</label>
            <div className="flex flex-wrap gap-2">
              {accountIcons.map((icon, index) => (
                <button
                  key={index}
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
              {accountColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-full border-2 transition
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
              {editingAccount ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
