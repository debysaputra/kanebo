import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Goal from "@/models/Goal"

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()

    const goals = await Goal.find({ userId: session.user.id }).sort({ createdAt: -1 })

    return NextResponse.json(goals)
  } catch (error) {
    console.error("Get goals error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, targetAmount, currentAmount, deadline, color, icon } = await request.json()

    if (!name || !targetAmount) {
      return NextResponse.json({ error: "Nama dan target tabungan wajib diisi" }, { status: 400 })
    }

    await connectDB()

    const goal = await Goal.create({
      userId: session.user.id,
      name,
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline: deadline ? new Date(deadline) : null,
      color: color || "#3B82F6",
      icon: icon || "🎯",
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error("Create goal error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
