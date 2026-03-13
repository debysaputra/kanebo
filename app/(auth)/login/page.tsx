"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LogIn, Loader2, Sparkles } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (loginUsername: string, loginPassword: string) => {
    setLoading(true)
    setError("")
    try {
      const result = await signIn("credentials", {
        username: loginUsername,
        password: loginPassword,
        redirect: false,
      })
      if (result?.error) {
        setError("Username atau password salah")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleLogin(username, password)
  }

  const handleDemo = async () => {
    setDemoLoading(true)
    setError("")
    try {
      // Reset & isi ulang data demo
      await fetch("/api/demo/reset", { method: "POST" })
      // Login sebagai demo
      const result = await signIn("credentials", {
        username: "demo",
        password: "demo123",
        redirect: false,
      })
      if (result?.error) {
        setError("Gagal masuk ke akun demo. Coba lagi.")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.")
    } finally {
      setDemoLoading(false)
    }
  }

  const isAnyLoading = loading || demoLoading

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Masuk</h2>
      <p className="text-gray-500 text-sm mb-6">Selamat datang kembali!</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Masukkan username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-12"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isAnyLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <LogIn size={20} />
              Masuk
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs text-gray-400">
          <span className="bg-white px-3">atau coba tanpa daftar</span>
        </div>
      </div>

      {/* Demo button */}
      <button
        type="button"
        onClick={handleDemo}
        disabled={isAnyLoading}
        className="w-full relative overflow-hidden rounded-xl py-4 px-5 transition disabled:opacity-60
          bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600
          text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300"
      >
        <div className="flex items-center justify-center gap-3">
          {demoLoading ? (
            <>
              <Loader2 size={20} className="animate-spin flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm leading-none mb-0.5">Menyiapkan data demo...</p>
                <p className="text-xs text-indigo-200">Mohon tunggu sebentar</p>
              </div>
            </>
          ) : (
            <>
              <Sparkles size={22} className="flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm leading-none mb-0.5">Coba Akun Demo</p>
                <p className="text-xs text-indigo-200">Lengkap dengan data transaksi, anggaran & tujuan</p>
              </div>
            </>
          )}
        </div>
      </button>

      {/* Demo info card */}
      <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
        <p className="text-xs font-semibold text-indigo-700 mb-2">Yang tersedia di akun demo:</p>
        <div className="grid grid-cols-2 gap-1.5 text-xs text-indigo-600">
          <span className="flex items-center gap-1.5"><span>💰</span> 3 akun keuangan</span>
          <span className="flex items-center gap-1.5"><span>📊</span> Riwayat 3 bulan</span>
          <span className="flex items-center gap-1.5"><span>📋</span> Anggaran bulanan</span>
          <span className="flex items-center gap-1.5"><span>🎯</span> Tujuan keuangan</span>
          <span className="flex items-center gap-1.5"><span>🤝</span> Catatan hutang</span>
          <span className="flex items-center gap-1.5"><span>🔄</span> Reset otomatis</span>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-5">
        Akun hanya bisa dibuat oleh admin.
      </p>
    </div>
  )
}
