import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Category from "@/models/Category"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { name, type, color, icon } = await request.json()

    await connectDB()

    const category = await Category.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { name, type, color, icon },
      { new: true }
    )

    if (!category) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error("Update category error:", error)
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

    const category = await Category.findOne({ _id: id, userId: session.user.id })
    if (!category) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 })
    }

    if (category.isDefault) {
      return NextResponse.json({ error: "Kategori default tidak dapat dihapus" }, { status: 400 })
    }

    await Category.findByIdAndDelete(id)

    return NextResponse.json({ message: "Kategori berhasil dihapus" })
  } catch (error) {
    console.error("Delete category error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
