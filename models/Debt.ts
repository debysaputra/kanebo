import mongoose, { Schema, Document, Types } from "mongoose"

export interface IDebt extends Document {
  userId: Types.ObjectId
  type: "debt" | "receivable"
  personName: string
  amount: number
  paidAmount: number
  date: Date
  dueDate: Date | null
  status: "unpaid" | "partial" | "paid"
  description: string
  notes: string
  createdAt: Date
  updatedAt: Date
}

const DebtSchema = new Schema<IDebt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["debt", "receivable"],
      required: true,
    },
    personName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

DebtSchema.index({ userId: 1, type: 1 })
DebtSchema.index({ userId: 1, status: 1 })

export default mongoose.models.Debt || mongoose.model<IDebt>("Debt", DebtSchema)
