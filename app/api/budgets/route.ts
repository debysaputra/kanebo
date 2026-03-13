import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Budget from "@/models/Budget"
import Transaction from "@/models/Transaction"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const now = new Date()
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1))
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()))

    await connectDB()

    const budgets = await Budget.find({
      userId: session.user.id,
      month,
      year,
    }).populate("categoryId", "name color icon type")

    // Calculate actual spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59)

        const spendingResult = await Transaction.aggregate([
          {
            $match: {
              userId: budget.userId,
              categoryId: budget.categoryId._id,
              type: "expense",
              date: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ])

        const spent = spendingResult[0]?.total || 0

        return {
          ...budget.toObject(),
          spent,
        }
      })
    )

    return NextResponse.json(budgetsWithSpending)
  } catch (error) {
    console.error("Get budgets error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { categoryId, amount, month, year } = await request.json()

    if (!categoryId || !amount || !month || !year) {
      return NextResponse.json({ error: "Data anggaran tidak lengkap" }, { status: 400 })
    }

    await connectDB()

    // Check if budget already exists for this category/month/year
    const existingBudget = await Budget.findOne({
      userId: session.user.id,
      categoryId,
      month,
      year,
    })

    if (existingBudget) {
      return NextResponse.json(
        { error: "Anggaran untuk kategori ini sudah ada di bulan tersebut" },
        { status: 400 }
      )
    }

    const budget = await Budget.create({
      userId: session.user.id,
      categoryId,
      amount,
      spent: 0,
      month,
      year,
    })

    const populated = await budget.populate("categoryId", "name color icon type")

    return NextResponse.json(populated, { status: 201 })
  } catch (error) {
    console.error("Create budget error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
