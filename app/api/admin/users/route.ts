import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import Category from "@/models/Category"

const defaultCategories = [
  { name: "Makanan & Minuman", type: "expense", color: "#EF4444", icon: "🍽️", isDefault: true },
  { name: "Transportasi", type: "expense", color: "#F97316", icon: "🚗", isDefault: true },
  { name: "Belanja", type: "expense", color: "#A855F7", icon: "🛍️", isDefault: true },
  { name: "Hiburan", type: "expense", color: "#EC4899", icon: "🎮", isDefault: true },
  { name: "Kesehatan", type: "expense", color: "#10B981", icon: "💊", isDefault: true },
  { name: "Pendidikan", type: "expense", color: "#3B82F6", icon: "📚", isDefault: true },
  { name: "Tagihan", type: "expense", color: "#6B7280", icon: "📄", isDefault: true },
  { name: "Lainnya", type: "expense", color: "#78716C", icon: "💰", isDefault: true },
  { name: "Gaji", type: "income", color: "#22C55E", icon: "💼", isDefault: true },
  { name: "Freelance", type: "income", color: "#10B981", icon: "💻", isDefault: true },
  { name: "Investasi", type: "income", color: "#3B82F6", icon: "📈", isDefault: true },
  { name: "Bonus", type: "income", color: "#F59E0B", icon: "🎁", isDefault: true },
  { name: "Lainnya", type: "income", color: "#78716C", icon: "💰", isDefault: true },
]

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return { error: "Unauthorized", status: 401 }
  if (session.user.role !== "admin") return { error: "Forbidden", status: 403 }
  return { session }
}

export async function GET() {
  const check = await requireAdmin()
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  try {
    await connectDB()
    const users = await User.find({}).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ users })
  } catch (error) {
    console.error("Admin get users error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  try {
    const { email, password, name, role = "user" } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, dan nama wajib diisi" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 })
    }

    if (!["user", "admin"].includes(role)) {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 })
    }

    await connectDB()

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await User.create({ email: email.toLowerCase(), password: hashedPassword, name, role })

    // Seed default categories for new user
    const categoriesWithUserId = defaultCategories.map((cat) => ({ ...cat, userId: user._id }))
    await Category.insertMany(categoriesWithUserId)

    return NextResponse.json(
      { message: "User berhasil dibuat", userId: user._id.toString() },
      { status: 201 }
    )
  } catch (error) {
    console.error("Admin create user error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
