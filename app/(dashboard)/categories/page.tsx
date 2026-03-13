"use client"

import { useEffect, useState } from "react"
import { Plus, Edit2, Trash2, Tag, Loader2, Lock } from "lucide-react"
import Modal from "@/components/Modal"

interface Category {
  _id: string
  name: string
  type: "income" | "expense"
  color: string
  icon: string
  isDefault: boolean
}

const categoryColors = [
  "#EF4444", "#F97316", "#F59E0B", "#22C55E", "#10B981",
  "#3B82F6", "#8B5CF6", "#EC4899", "#A855F7", "#6B7280",
  "#14B8A6", "#0EA5E9", "#78716C", "#64748B",
]

const categoryIcons = [
  "🍽️", "🚗", "🛍️", "🎮", "💊", "📚", "📄", "💰",
  "💼", "💻", "📈", "🎁", "🏠", "✈️", "🎵", "⚽",
  "📱", "🐶", "👗", "🎨", "🏋️", "☕", "🎓", "🔧",
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense")

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    type: "expense",
    color: "#EF4444",
    icon: "💰",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingCat(null)
    setForm({ name: "", type: activeTab, color: "#EF4444", icon: "💰" })
    setError("")
    setModalOpen(true)
  }

  function openEdit(cat: Category) {
    setEditingCat(cat)
    setForm({ name: cat.name, type: cat.type, color: cat.color, icon: cat.icon })
    setError("")
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      let res: Response
      if (editingCat) {
        res = await fetch(`/api/categories/${editingCat._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      } else {
        res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan")
        return
      }

      await fetchCategories()
      setModalOpen(false)
    } catch {
      setError("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus kategori ini?")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error)
        return
      }
      setCategories((prev) => prev.filter((c) => c._id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const filtered = categories.filter((c) => c.type === activeTab)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs + Add button */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("expense")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "expense"
                ? "bg-white text-red-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => setActiveTab("income")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "income"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pemasukan
          </button>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition font-medium text-sm"
        >
          <Plus size={18} />
          Tambah
        </button>
      </div>

      {/* Category Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Tag size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500">Belum ada kategori</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((cat) => (
            <div
              key={cat._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition group relative"
            >
              {/* Default badge */}
              {cat.isDefault && (
                <div className="absolute top-2 right-2">
                  <Lock size={12} className="text-gray-300" />
                </div>
              )}

              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: cat.color + "20" }}
                >
                  {cat.icon}
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{cat.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: cat.color }}>
                    {cat.isDefault ? "Default" : "Custom"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 mt-3 justify-center opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                >
                  <Edit2 size={14} />
                </button>
                {!cat.isDefault && (
                  <button
                    onClick={() => handleDelete(cat._id)}
                    disabled={deleting === cat._id}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                  >
                    {deleting === cat._id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCat ? "Edit Kategori" : "Tambah Kategori"}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nama kategori"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ikon</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {categoryIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm({ ...form, icon })}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border-2 transition
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
              {categoryColors.map((color) => (
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

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: form.color + "20" }}
            >
              {form.icon}
            </div>
            <div>
              <p className="font-medium text-sm text-gray-800">{form.name || "Nama kategori"}</p>
              <p className="text-xs" style={{ color: form.color }}>
                {form.type === "expense" ? "Pengeluaran" : "Pemasukan"}
              </p>
            </div>
          </div>

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
              {editingCat ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
