import mongoose, { Schema, Document, Types } from "mongoose"

export type TransactionType = "income" | "expense" | "transfer"

export interface ITransaction extends Document {
  userId: Types.ObjectId
  accountId: Types.ObjectId
  categoryId: Types.ObjectId | null
  type: TransactionType
  amount: number
  description: string
  date: Date
  transferToAccountId: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    type: {
      type: String,
      enum: ["income", "expense", "transfer"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    transferToAccountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

TransactionSchema.index({ userId: 1, date: -1 })
TransactionSchema.index({ userId: 1, type: 1 })
TransactionSchema.index({ userId: 1, accountId: 1 })

export default mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema)
