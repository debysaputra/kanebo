import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Account from "@/models/Account"

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()
    const accounts = await Account.find({
      userId: session.user.id,
      isActive: true,
    }).sort({ createdAt: -1 })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Get accounts error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, type, balance, color, icon } = await request.json()

    if (!name || !type) {
      return NextResponse.json({ error: "Nama dan tipe akun wajib diisi" }, { status: 400 })
    }

    await connectDB()

    const account = await Account.create({
      userId: session.user.id,
      name,
      type,
      balance: balance || 0,
      color: color || "#3B82F6",
      icon: icon || "💳",
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error("Create account error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
