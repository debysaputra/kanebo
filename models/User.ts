import mongoose, { Schema, Document } from "mongoose"

export interface IUser extends Document {
  username: string
  password: string
  name: string
  role: "user" | "admin"
  createdAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
)

// Hapus model yang ter-cache agar schema terbaru selalu digunakan
// (mencegah error "email required" dari schema lama yang masih di-cache)
delete (mongoose.models as Record<string, unknown>).User

export default mongoose.model<IUser>("User", UserSchema)
