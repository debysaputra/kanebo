import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Goal from "@/models/Goal"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { name, targetAmount, currentAmount, deadline, color, icon } = await request.json()

    await connectDB()

    const goal = await Goal.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      {
        name,
        targetAmount,
        currentAmount,
        deadline: deadline ? new Date(deadline) : null,
        color,
        icon,
      },
      { new: true }
    )

    if (!goal) {
      return NextResponse.json({ error: "Tujuan tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(goal)
  } catch (error) {
    console.error("Update goal error:", error)
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

    const goal = await Goal.findOneAndDelete({ _id: id, userId: session.user.id })

    if (!goal) {
      return NextResponse.json({ error: "Tujuan tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ message: "Tujuan berhasil dihapus" })
  } catch (error) {
    console.error("Delete goal error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
