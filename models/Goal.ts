import mongoose, { Schema, Document, Types } from "mongoose"

export interface IGoal extends Document {
  userId: Types.ObjectId
  name: string
  targetAmount: number
  currentAmount: number
  deadline: Date | null
  color: string
  icon: string
  createdAt: Date
  updatedAt: Date
}

const GoalSchema = new Schema<IGoal>(
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
    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deadline: {
      type: Date,
      default: null,
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    icon: {
      type: String,
      default: "🎯",
    },
  },
  {
    timestamps: true,
  }
)

GoalSchema.index({ userId: 1 })

export default mongoose.models.Goal || mongoose.model<IGoal>("Goal", GoalSchema)
