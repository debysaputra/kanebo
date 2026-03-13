import mongoose, { Schema, Document, Types } from "mongoose"

export interface IBudget extends Document {
  userId: Types.ObjectId
  categoryId: Types.ObjectId
  amount: number
  spent: number
  month: number
  year: number
  createdAt: Date
  updatedAt: Date
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    spent: {
      type: Number,
      default: 0,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

BudgetSchema.index({ userId: 1, month: 1, year: 1 })
BudgetSchema.index({ userId: 1, categoryId: 1, month: 1, year: 1 }, { unique: true })

export default mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema)
