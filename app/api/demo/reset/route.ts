import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import Account from "@/models/Account"
import Transaction from "@/models/Transaction"
import Budget from "@/models/Budget"
import Goal from "@/models/Goal"
import Debt from "@/models/Debt"
import Category from "@/models/Category"

const defaultCategories = [
  { name: "Makanan & Minuman", type: "expense", color: "#EF4444", icon: "🍽️", isDefault: true },
  { name: "Transportasi",       type: "expense", color: "#F97316", icon: "🚗",  isDefault: true },
  { name: "Belanja",            type: "expense", color: "#A855F7", icon: "🛍️",  isDefault: true },
  { name: "Hiburan",            type: "expense", color: "#EC4899", icon: "🎮",  isDefault: true },
  { name: "Kesehatan",          type: "expense", color: "#10B981", icon: "💊",  isDefault: true },
  { name: "Pendidikan",         type: "expense", color: "#3B82F6", icon: "📚",  isDefault: true },
  { name: "Tagihan",            type: "expense", color: "#6B7280", icon: "📄",  isDefault: true },
  { name: "Lainnya",            type: "expense", color: "#78716C", icon: "💰",  isDefault: true },
  { name: "Gaji",               type: "income",  color: "#22C55E", icon: "💼",  isDefault: true },
  { name: "Freelance",          type: "income",  color: "#10B981", icon: "💻",  isDefault: true },
  { name: "Investasi",          type: "income",  color: "#3B82F6", icon: "📈",  isDefault: true },
  { name: "Bonus",              type: "income",  color: "#F59E0B", icon: "🎁",  isDefault: true },
  { name: "Lainnya",            type: "income",  color: "#78716C", icon: "💰",  isDefault: true },
]

function d(y: number, m: number, day: number) {
  return new Date(y, m - 1, day)
}

export async function POST() {
  try {
    await connectDB()

    const demoUser = await User.findOne({ username: "demo" }).lean() as { _id: unknown } | null
    if (!demoUser) {
      return NextResponse.json({ error: "Demo user tidak ditemukan" }, { status: 404 })
    }
    const userId = demoUser._id

    // Hapus semua data demo lama
    await Promise.all([
      Account.deleteMany({ userId }),
      Transaction.deleteMany({ userId }),
      Budget.deleteMany({ userId }),
      Goal.deleteMany({ userId }),
      Debt.deleteMany({ userId }),
      Category.deleteMany({ userId }),
    ])

    // Seed ulang kategori
    const cats = await Category.insertMany(
      defaultCategories.map((c) => ({ ...c, userId }))
    )

    // Helper cari kategori
    type CatDoc = { _id: unknown; name: string; type: string }
    const catList = cats as unknown as CatDoc[]
    const cat = (name: string, type: string) =>
      catList.find((c) => c.name === name && c.type === type)?._id ?? null

    // --- AKUN ---
    // Final balance dihitung manual dari semua transaksi di bawah
    // BCA:  income 27.5M - transfers_out 2.4M - expenses_bca 3.98M = 21.12M
    // GoPay: transfers_in 1.7M - expenses_gopay 0.87M = 0.83M
    // Dompet: transfers_in 0.7M - expenses_dompet 0.245M = 0.455M
    const [bca, gopay, dompet] = await Promise.all([
      Account.create({ userId, name: "BCA Tabungan",  type: "bank",    balance: 21120000, color: "#3B82F6", icon: "🏦" }),
      Account.create({ userId, name: "GoPay",         type: "ewallet", balance: 830000,   color: "#22C55E", icon: "📱" }),
      Account.create({ userId, name: "Dompet Tunai",  type: "cash",    balance: 455000,   color: "#F59E0B", icon: "👛" }),
    ])

    // --- TRANSAKSI (3 bulan: Jan-Mar 2026) ---
    const txData = [
      // ── JANUARI 2026 ──
      { date: d(2026,1,1),  accountId: bca._id,    transferToAccountId: null,     categoryId: cat("Gaji","income"),              type:"income",   amount:8000000, description:"Gaji Januari" },
      { date: d(2026,1,2),  accountId: bca._id,    transferToAccountId: gopay._id, categoryId: null,                              type:"transfer", amount:500000,  description:"Top up GoPay" },
      { date: d(2026,1,2),  accountId: bca._id,    transferToAccountId: dompet._id,categoryId: null,                              type:"transfer", amount:200000,  description:"Ambil tunai" },
      { date: d(2026,1,5),  accountId: gopay._id,  transferToAccountId: null,     categoryId: cat("Makanan & Minuman","expense"), type:"expense",  amount:85000,   description:"Makan siang kantor" },
      { date: d(2026,1,7),  accountId: gopay._id,  transferToAccountId: null,     categoryId: cat("Transportasi","expense"),      type:"expense",  amount:45000,   description:"Grab ke kantor" },
      { date: d(2026,1,10), accountId: bca._id,    transferToAccountId: null,     categoryId: cat("Tagihan","expense"),           type:"expense",  amount:350000,  description:"Tagihan listrik" },
      { date: d(2026,1,12), accountId: gopay._id,  transferToAccountId: null,     categoryId: cat("Makanan & Minuman","expense"), type:"expense",  amount:125000,  description:"Makan malam keluarga" },
      { date: d(2026,1,15), accountId: bca._id,    transferToAccountId: null,     categoryId: cat("Hiburan","expense"),           type:"expense",  amount:150000,  description:"Netflix + Spotify" },
      { date: d(2026,1,18), accountId: bca._id,    transferToAccountId: null,     categoryId: cat("Belanja","expense"),           type:"expense",  amount:280000,  description:"Belanja kebutuhan bulanan" },
      { date: d(2026,1,20), accountId: bca._id,    transferToAccountId: null,     categoryId: cat("Freelance","income"),          type:"income",   amount:1500000, description:"Freelance web design" },
      { date: d(2026,1,22), accountId: bca._id,    transferToAccountId: null,     categoryId: cat("Kesehatan","expense"),         type:"expense",  amount:180000,  description:"Vitamin & suplemen" },
      { date: d(2026,1,25), accountId: dompet._id, transferToAccountId: null,     categoryId: cat("Makanan & Minuman","expense"), type:"expense",  amount:65000,   description:"Sarapan warung" },
      { date: d(2026,1,28), accountId: bca._id,    transferToAccountId: null,     categoryId: cat("Belanja","expense"),           type:"expense",  amount:450000,  description:"Belanja online Shopee" },
      { date: d(2026,1,30), accountId: dompet._id, transferToAccountId: null,     categoryId: cat("Transportasi","expense"),      type:"expense",  amount:30000,   description:"Bensin motor" },

      // ── FEBRUARI 2026 ──
      { date: d(2026,2,1),  accountId: bca._id,    transferToAccountId: null,      categoryId: cat("Gaji","income"),              type:"income",   amount:8000000, description:"Gaji Februari" },
      { date: d(2026,2,1),  accountId: bca._id,    transferToAccountId: dompet._id, categoryId: null,                             type:"transfer", amount:300000,  description:"Ambil tunai" },
      { date: d(2026,2,3),  accountId: bca._id,    transferToAccountId: null,      categoryId: cat("Tagihan","expense"),           type:"expense",  amount:350000,  description:"Tagihan internet & TV" },
      { date: d(2026,2,5),  accountId: bca._id,    transferToAccountId: gopay._id, categoryId: null,                              type:"transfer", amount:700000,  description:"Top up GoPay" },
      { date: d(2026,2,7),  accountId: gopay._id,  transferToAccountId: null,      categoryId: cat("Makanan & Minuman","expense"), type:"expense",  amount:95000,   description:"Makan siang" },
      { date: d(2026,2,10), accountId: gopay._id,  transferToAccountId: null,      categoryId: cat("Transportasi","expense"),      type:"expense",  amount:55000,   description:"Ojek online" },
      { date: d(2026,2,12), accountId: gopay._id,  transferToAccountId: null,      categoryId: cat("Makanan & Minuman","expense"), type:"expense",  amount:110000,  description:"Kopi & snack" },
      { date: d(2026,2,14), accountId: bca._id,    transferToAccountId: null,      categoryId: cat("Hiburan","expense"),           type:"expense",  amount:350000,  description:"Dinner Valentine" },
      { date: d(2026,2,17), accountId: dompet._id, transferToAccountId: null,      categoryId: cat("Makanan & Minuman","expense"), type:"expense",  amount:75000,   description:"Jajan pasar" },
      { date: d(2026,2,19), accountId: bca._id,    transferToAccountId: null,      categoryId: cat("Pendidikan","expense"),        type:"expense",  amount:500000,  description:"Kursus desain online" },
      { date: d(2026,2,22), accountId: bca._id,    transferToAccountId: null,      categoryId: cat("Freelance","income"),          type:"income",   amount:2000000, description:"Project landing page" },
      { date: d(2026,2,25), accountId: bca._id,    transferToAccountId: null,      categoryId: cat("Belanja","expense"),           type:"expense",  amount:380000,  description:"Belanja bulanan" },
      { date: d(2026,2,28), accountId: gopay._id,  transferToAccountId: null,      categoryId: cat("Makanan & Minuman","expense"), type:"expense",  amount:130000,  description:"Makan malam" },

      // ── MARET 2026 ──
      { date: d(2026,3,1),  accountId: bca._id,    transferToAccountId: null,      categoryId: cat("Gaji","income"),              type:"income",   amount:8000000, description:"Gaji Maret" },
      { date: d(2026,3,1),  accountId: bca._id,    transferToAccountId: dompet._id, categoryId: null,                             type:"transfer", amount:200000,  description:"Ambil tunai" },
      { date: d(2026,3,2),  accountId: bca._id,    transferToAccountId: null,      categoryId: cat("Tagihan","expense"),           type:"expense",  amount:320000,  description:"Tagihan listrik" },
      { date: d(2026,3,3),  accountId: bca._id,    transferToAccountId: gopay._id, categoryId: null,                              type:"transfer", amount:500000,  description:"Top up GoPay" },
      { date: d(2026,3,5),  accountId: gopay._id,  transferToAccountId: null,      categoryId: cat("Makanan & Minuman","expense"), type:"expense",  amount:85000,   description:"Makan siang" },
      { date: d(2026,3,7),  accountId: gopay._id,  transferToAccountId: null,      categoryId: cat("Transportasi","expense"),      type:"expense",  amount:45000,   description:"Grab ke mall" },
      { date: d(2026,3,8),  accountId: bca._id,    transferToAccountId: null,      categoryId: cat("Kesehatan","expense"),         type:"expense",  amount:250000,  description:"Konsultasi dokter" },
      { date: d(2026,3,10), accountId: gopay._id,  transferToAccountId: null,      categoryId: cat("Makanan & Minuman","expense"), type:"expense",  amount:95000,   description:"Makan bareng teman" },
      { date: d(2026,3,12), accountId: bca._id,    transferToAccountId: null,      categoryId: cat("Belanja","expense"),           type:"expense",  amount:420000,  description:"Belanja rumah tangga" },
      { date: d(2026,3,13), accountId: dompet._id, transferToAccountId: null,      categoryId: cat("Makanan & Minuman","expense"), type:"expense",  amount:75000,   description:"Makan pagi" },
    ]

    await Transaction.insertMany(txData.map((t) => ({ ...t, userId })))

    // --- ANGGARAN (Maret 2026) ---
    const budgetData = [
      { categoryId: cat("Makanan & Minuman","expense"), amount: 1500000 },
      { categoryId: cat("Transportasi","expense"),       amount: 500000  },
      { categoryId: cat("Belanja","expense"),            amount: 800000  },
      { categoryId: cat("Kesehatan","expense"),          amount: 500000  },
      { categoryId: cat("Tagihan","expense"),            amount: 400000  },
      { categoryId: cat("Hiburan","expense"),            amount: 300000  },
    ]

    await Budget.insertMany(
      budgetData.map((b) => ({ ...b, userId, month: 3, year: 2026, spent: 0 }))
    )

    // --- TUJUAN KEUANGAN ---
    await Goal.insertMany([
      { userId, name: "Dana Darurat",    targetAmount: 30000000,  currentAmount: 12000000, deadline: null,              color: "#22C55E", icon: "🛡️" },
      { userId, name: "Liburan Bali",    targetAmount: 5000000,   currentAmount: 1500000,  deadline: d(2026,7,1),       color: "#3B82F6", icon: "🏖️" },
      { userId, name: "Beli Motor Baru", targetAmount: 25000000,  currentAmount: 8000000,  deadline: d(2027,6,30),      color: "#F97316", icon: "🏍️" },
      { userId, name: "Beli Rumah",      targetAmount: 500000000, currentAmount: 25000000, deadline: d(2030,12,31),     color: "#8B5CF6", icon: "🏠" },
    ])

    // --- HUTANG & PIUTANG ---
    await Debt.insertMany([
      {
        userId, type: "debt", personName: "Rizal",
        amount: 2000000, paidAmount: 500000, date: d(2026,2,15), dueDate: d(2026,3,30),
        status: "partial", description: "Pinjam buat beli laptop second", notes: "Sisanya bulan depan",
      },
      {
        userId, type: "receivable", personName: "Agus",
        amount: 1500000, paidAmount: 0, date: d(2026,2,20), dueDate: d(2026,4,15),
        status: "unpaid", description: "Patungan acara kantor", notes: "",
      },
      {
        userId, type: "debt", personName: "Mama",
        amount: 3000000, paidAmount: 3000000, date: d(2025,12,1), dueDate: null,
        status: "paid", description: "Pinjam buat biaya rumah sakit", notes: "Sudah lunas",
      },
      {
        userId, type: "receivable", personName: "Budi Santoso",
        amount: 500000, paidAmount: 0, date: d(2026,3,5), dueDate: null,
        status: "unpaid", description: "Patungan kado ulang tahun teman", notes: "",
      },
    ])

    return NextResponse.json({ message: "Data demo berhasil direset" })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Demo reset error:", message)
    return NextResponse.json({ error: `Gagal reset demo: ${message}` }, { status: 500 })
  }
}
