import mongoose, { Schema, Document, Types } from "mongoose"

export type AccountType = "cash" | "bank" | "ewallet" | "credit"

export interface IAccount extends Document {
  userId: Types.ObjectId
  name: string
  type: AccountType
  balance: number
  color: string
  icon: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["cash", "bank", "ewallet", "credit"],
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    icon: {
      type: String,
      default: "💳",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

AccountSchema.index({ userId: 1 })

export default mongoose.models.Account || mongoose.model<IAccount>("Account", AccountSchema)
