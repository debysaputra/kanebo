import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Budget from "@/models/Budget"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { amount } = await request.json()

    await connectDB()

    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { amount },
      { new: true }
    ).populate("categoryId", "name color icon type")

    if (!budget) {
      return NextResponse.json({ error: "Anggaran tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(budget)
  } catch (error) {
    console.error("Update budget error:", error)
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

    const budget = await Budget.findOneAndDelete({ _id: id, userId: session.user.id })

    if (!budget) {
      return NextResponse.json({ error: "Anggaran tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ message: "Anggaran berhasil dihapus" })
  } catch (error) {
    console.error("Delete budget error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
