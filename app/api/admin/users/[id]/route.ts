import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return { error: "Unauthorized", status: 401 }
  if (session.user.role !== "admin") return { error: "Forbidden", status: 403 }
  return { session }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin()
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  try {
    const { id } = await params
    await connectDB()
    const user = await User.findById(id).lean()
    if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    return NextResponse.json({ user })
  } catch (error) {
    console.error("Admin get user error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin()
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  try {
    const { id } = await params
    const { name, username, role, password } = await request.json()

    await connectDB()

    const user = await User.findById(id)
    if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })

    // Validasi password jika diisi
    if (password && password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 })
    }

    // Cek konflik username
    if (username) {
      const conflict = await User.findOne({
        username: username.toLowerCase(),
        _id: { $ne: id },
      })
      if (conflict) {
        return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 })
      }
    }

    // Bangun objek update — hindari select:false issue dengan $set langsung
    const updateFields: Record<string, string> = {}
    if (name) updateFields.name = name
    if (username) updateFields.username = username.toLowerCase()
    if (role && ["user", "admin"].includes(role)) updateFields.role = role
    if (password) updateFields.password = await bcrypt.hash(password, 12)

    await User.findByIdAndUpdate(id, { $set: updateFields })

    return NextResponse.json({ message: "User berhasil diupdate" })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Admin update user error:", message)
    return NextResponse.json({ error: `Terjadi kesalahan: ${message}` }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin()
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const { session } = check

  try {
    const { id } = await params
    await connectDB()

    const user = await User.findById(id)
    if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })

    if (user._id.toString() === session.user.id) {
      return NextResponse.json({ error: "Tidak dapat menghapus akun sendiri" }, { status: 400 })
    }

    await User.findByIdAndDelete(id)
    return NextResponse.json({ message: "User berhasil dihapus" })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Admin delete user error:", message)
    return NextResponse.json({ error: `Terjadi kesalahan: ${message}` }, { status: 500 })
  }
}
