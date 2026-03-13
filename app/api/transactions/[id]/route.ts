import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import Transaction from "@/models/Transaction"
import Account from "@/models/Account"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { accountId, categoryId, type, amount, description, date, transferToAccountId } =
      await request.json()

    await connectDB()

    // Get original transaction
    const originalTransaction = await Transaction.findOne({ _id: id, userId: session.user.id })
    if (!originalTransaction) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 })
    }

    // Revert original balance changes
    const originalAccount = await Account.findById(originalTransaction.accountId)
    if (originalAccount) {
      if (originalTransaction.type === "income") {
        originalAccount.balance -= originalTransaction.amount
      } else if (originalTransaction.type === "expense") {
        originalAccount.balance += originalTransaction.amount
      } else if (originalTransaction.type === "transfer" && originalTransaction.transferToAccountId) {
        originalAccount.balance += originalTransaction.amount
        const originalToAccount = await Account.findById(originalTransaction.transferToAccountId)
        if (originalToAccount) {
          originalToAccount.balance -= originalTransaction.amount
          await originalToAccount.save()
        }
      }
      await originalAccount.save()
    }

    // Apply new balance changes
    const newAccount = await Account.findOne({ _id: accountId, userId: session.user.id })
    if (!newAccount) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 })
    }

    if (type === "income") {
      newAccount.balance += amount
    } else if (type === "expense") {
      newAccount.balance -= amount
    } else if (type === "transfer") {
      if (!transferToAccountId) {
        return NextResponse.json({ error: "Akun tujuan transfer wajib diisi" }, { status: 400 })
      }
      const newToAccount = await Account.findOne({ _id: transferToAccountId, userId: session.user.id })
      if (!newToAccount) {
        return NextResponse.json({ error: "Akun tujuan tidak ditemukan" }, { status: 404 })
      }
      newAccount.balance -= amount
      newToAccount.balance += amount
      await newToAccount.save()
    }

    await newAccount.save()

    // Update transaction
    const transaction = await Transaction.findByIdAndUpdate(
      id,
      {
        accountId,
        categoryId: categoryId || null,
        type,
        amount,
        description: description || "",
        date: date ? new Date(date) : new Date(),
        transferToAccountId: transferToAccountId || null,
      },
      { new: true }
    )
      .populate("accountId", "name color icon type")
      .populate("categoryId", "name color icon")
      .populate("transferToAccountId", "name color icon type")

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Update transaction error:", error)
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

    const transaction = await Transaction.findOne({ _id: id, userId: session.user.id })
    if (!transaction) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 })
    }

    // Revert balance changes
    const account = await Account.findById(transaction.accountId)
    if (account) {
      if (transaction.type === "income") {
        account.balance -= transaction.amount
      } else if (transaction.type === "expense") {
        account.balance += transaction.amount
      } else if (transaction.type === "transfer" && transaction.transferToAccountId) {
        account.balance += transaction.amount
        const toAccount = await Account.findById(transaction.transferToAccountId)
        if (toAccount) {
          toAccount.balance -= transaction.amount
          await toAccount.save()
        }
      }
      await account.save()
    }

    await Transaction.findByIdAndDelete(id)

    return NextResponse.json({ message: "Transaksi berhasil dihapus" })
  } catch (error) {
    console.error("Delete transaction error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
