import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Transaction from "@/models/Transaction"
import Account from "@/models/Account"
import mongoose from "mongoose"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const now = new Date()
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1))
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()))

    await connectDB()

    const userId = new mongoose.Types.ObjectId(session.user.id)

    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59)

    // Monthly income and expense
    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
          type: { $in: ["income", "expense"] },
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ])

    const income = monthlyStats.find((s) => s._id === "income")?.total || 0
    const expense = monthlyStats.find((s) => s._id === "expense")?.total || 0

    // Total balance from all accounts
    const accounts = await Account.find({ userId, isActive: true })
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

    // Recent transactions (last 5)
    const recentTransactions = await Transaction.find({ userId })
      .populate("accountId", "name color icon")
      .populate("categoryId", "name color icon")
      .sort({ date: -1 })
      .limit(5)

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const monthlyTrend = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: sixMonthsAgo },
          type: { $in: ["income", "expense"] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ])

    // Category spending for this month
    const categorySpending = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
          type: "expense",
          categoryId: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$categoryId",
          total: { $sum: "$amount" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $project: {
          name: "$category.name",
          color: "$category.color",
          icon: "$category.icon",
          total: 1,
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $limit: 6,
      },
    ])

    return NextResponse.json({
      totalBalance,
      income,
      expense,
      netSavings: income - expense,
      recentTransactions,
      monthlyTrend,
      categorySpending,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
