import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Account from "@/models/Account"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { name, type, balance, color, icon } = await request.json()

    await connectDB()

    const account = await Account.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { name, type, balance, color, icon },
      { new: true }
    )

    if (!account) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(account)
  } catch (error) {
    console.error("Update account error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    await connectDB()

    const account = await Account.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { isActive: false },
      { new: true }
    )

    if (!account) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ message: "Akun berhasil dihapus" })
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
