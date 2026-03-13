import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Debt from "@/models/Debt"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await connectDB()
    const debt = await Debt.findOne({ _id: id, userId: session.user.id }).lean()
    if (!debt) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
    return NextResponse.json(debt)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `Terjadi kesalahan: ${message}` }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const { type, personName, amount, paidAmount, date, dueDate, status, description, notes } = await request.json()

    await connectDB()

    const debt = await Debt.findOne({ _id: id, userId: session.user.id })
    if (!debt) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })

    if (amount <= 0) {
      return NextResponse.json({ error: "Jumlah harus lebih dari 0" }, { status: 400 })
    }

    const paid = paidAmount ?? debt.paidAmount
    const total = amount ?? debt.amount

    // Auto-calculate status
    let computedStatus = status
    if (!status) {
      if (paid <= 0) computedStatus = "unpaid"
      else if (paid >= total) computedStatus = "paid"
      else computedStatus = "partial"
    }

    const updateFields: Record<string, unknown> = {}
    if (type) updateFields.type = type
    if (personName) updateFields.personName = personName
    if (amount !== undefined) updateFields.amount = amount
    if (paidAmount !== undefined) updateFields.paidAmount = Math.min(paidAmount, amount ?? debt.amount)
    if (date) updateFields.date = new Date(date)
    updateFields.dueDate = dueDate ? new Date(dueDate) : null
    if (computedStatus) updateFields.status = computedStatus
    if (description !== undefined) updateFields.description = description
    if (notes !== undefined) updateFields.notes = notes

    await Debt.findByIdAndUpdate(id, { $set: updateFields })

    return NextResponse.json({ message: "Data berhasil diupdate" })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `Terjadi kesalahan: ${message}` }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await connectDB()
    const debt = await Debt.findOne({ _id: id, userId: session.user.id })
    if (!debt) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
    await Debt.findByIdAndDelete(id)
    return NextResponse.json({ message: "Data berhasil dihapus" })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `Terjadi kesalahan: ${message}` }, { status: 500 })
  }
}
