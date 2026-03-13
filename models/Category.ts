import mongoose, { Schema, Document, Types } from "mongoose"

export type CategoryType = "income" | "expense"

export interface ICategory extends Document {
  userId: Types.ObjectId
  name: string
  type: CategoryType
  color: string
  icon: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
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
      enum: ["income", "expense"],
      required: true,
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    icon: {
      type: String,
      default: "💰",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

CategorySchema.index({ userId: 1, type: 1 })

export default mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema)
