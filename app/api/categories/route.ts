import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Category from "@/models/Category"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    await connectDB()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { userId: session.user.id }
    if (type && type !== "all") query.type = type

    const categories = await Category.find(query).sort({ isDefault: -1, name: 1 })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, type, color, icon } = await request.json()

    if (!name || !type) {
      return NextResponse.json({ error: "Nama dan tipe kategori wajib diisi" }, { status: 400 })
    }

    await connectDB()

    const category = await Category.create({
      userId: session.user.id,
      name,
      type,
      color: color || "#3B82F6",
      icon: icon || "💰",
      isDefault: false,
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Create category error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
