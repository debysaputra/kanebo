import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Debt from "@/models/Debt"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const status = searchParams.get("status")

    const query: Record<string, unknown> = { userId: session.user.id }
    if (type && ["debt", "receivable"].includes(type)) query.type = type
    if (status && ["unpaid", "partial", "paid"].includes(status)) query.status = status

    const debts = await Debt.find(query).sort({ createdAt: -1 }).lean()
    return NextResponse.json(debts)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `Terjadi kesalahan: ${message}` }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { type, personName, amount, date, dueDate, description, notes } = await request.json()

    if (!type || !personName || !amount || !date) {
      return NextResponse.json({ error: "Tipe, nama, jumlah, dan tanggal wajib diisi" }, { status: 400 })
    }

    if (!["debt", "receivable"].includes(type)) {
      return NextResponse.json({ error: "Tipe tidak valid" }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Jumlah harus lebih dari 0" }, { status: 400 })
    }

    await connectDB()

    const debt = await Debt.create({
      userId: session.user.id,
      type,
      personName,
      amount,
      paidAmount: 0,
      date: new Date(date),
      dueDate: dueDate ? new Date(dueDate) : null,
      status: "unpaid",
      description: description || "",
      notes: notes || "",
    })

    return NextResponse.json(debt, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `Terjadi kesalahan: ${message}` }, { status: 500 })
  }
}
