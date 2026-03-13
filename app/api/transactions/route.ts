import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Transaction from "@/models/Transaction"
import Account from "@/models/Account"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const type = searchParams.get("type")
    const accountId = searchParams.get("accountId")
    const categoryId = searchParams.get("categoryId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const search = searchParams.get("search")

    await connectDB()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { userId: session.user.id }

    if (type && type !== "all") query.type = type
    if (accountId) query.accountId = accountId
    if (categoryId) query.categoryId = categoryId
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query.date.$lte = end
      }
    }
    if (search) {
      query.description = { $regex: search, $options: "i" }
    }

    const total = await Transaction.countDocuments(query)
    const transactions = await Transaction.find(query)
      .populate("accountId", "name color icon type")
      .populate("categoryId", "name color icon")
      .populate("transferToAccountId", "name color icon type")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    return NextResponse.json({
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Get transactions error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { accountId, categoryId, type, amount, description, date, transferToAccountId } =
      await request.json()

    if (!accountId || !type || !amount) {
      return NextResponse.json({ error: "Data transaksi tidak lengkap" }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Jumlah harus lebih dari 0" }, { status: 400 })
    }

    await connectDB()

    // Verify account belongs to user
    const account = await Account.findOne({ _id: accountId, userId: session.user.id })
    if (!account) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 })
    }

    // Update account balance
    if (type === "income") {
      account.balance += amount
    } else if (type === "expense") {
      account.balance -= amount
    } else if (type === "transfer") {
      if (!transferToAccountId) {
        return NextResponse.json({ error: "Akun tujuan transfer wajib diisi" }, { status: 400 })
      }
      const toAccount = await Account.findOne({ _id: transferToAccountId, userId: session.user.id })
      if (!toAccount) {
        return NextResponse.json({ error: "Akun tujuan tidak ditemukan" }, { status: 404 })
      }
      account.balance -= amount
      toAccount.balance += amount
      await toAccount.save()
    }

    await account.save()

    const transaction = await Transaction.create({
      userId: session.user.id,
      accountId,
      categoryId: categoryId || null,
      type,
      amount,
      description: description || "",
      date: date ? new Date(date) : new Date(),
      transferToAccountId: transferToAccountId || null,
    })

    const populated = await transaction.populate([
      { path: "accountId", select: "name color icon type" },
      { path: "categoryId", select: "name color icon" },
      { path: "transferToAccountId", select: "name color icon type" },
    ])

    return NextResponse.json(populated, { status: 201 })
  } catch (error) {
    console.error("Create transaction error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
