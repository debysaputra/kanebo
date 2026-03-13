/**
 * Script untuk membuat data awal: 1 admin + 4 test users
 *
 * Cara jalankan:
 *   npx tsx scripts/seed-users.ts
 *
 * Pastikan .env.local berisi MONGODB_URI yang benar.
 */

import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI tidak ditemukan di .env.local")
  process.exit(1)
}

// ---- Schema definitions (inline agar tidak perlu import dari project) ----

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
)

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    color: { type: String, default: "#6B7280" },
    icon: { type: String, default: "💰" },
    isDefault: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
)

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema)
const CategoryModel = mongoose.models.Category || mongoose.model("Category", CategorySchema)

// ---- Data ----

const defaultCategories = [
  { name: "Makanan & Minuman", type: "expense", color: "#EF4444", icon: "🍽️", isDefault: true },
  { name: "Transportasi", type: "expense", color: "#F97316", icon: "🚗", isDefault: true },
  { name: "Belanja", type: "expense", color: "#A855F7", icon: "🛍️", isDefault: true },
  { name: "Hiburan", type: "expense", color: "#EC4899", icon: "🎮", isDefault: true },
  { name: "Kesehatan", type: "expense", color: "#10B981", icon: "💊", isDefault: true },
  { name: "Pendidikan", type: "expense", color: "#3B82F6", icon: "📚", isDefault: true },
  { name: "Tagihan", type: "expense", color: "#6B7280", icon: "📄", isDefault: true },
  { name: "Lainnya", type: "expense", color: "#78716C", icon: "💰", isDefault: true },
  { name: "Gaji", type: "income", color: "#22C55E", icon: "💼", isDefault: true },
  { name: "Freelance", type: "income", color: "#10B981", icon: "💻", isDefault: true },
  { name: "Investasi", type: "income", color: "#3B82F6", icon: "📈", isDefault: true },
  { name: "Bonus", type: "income", color: "#F59E0B", icon: "🎁", isDefault: true },
  { name: "Lainnya", type: "income", color: "#78716C", icon: "💰", isDefault: true },
]

const usersToSeed = [
  // Admin
  {
    name: "Admin Kanebo",
    email: "admin@kanebo.com",
    password: "admin123",
    role: "admin",
  },
  // Demo
  {
    name: "Demo User",
    email: "demo@kanebo.com",
    password: "demo123",
    role: "user",
  },
  // Test users
  {
    name: "Budi Santoso",
    email: "budi@test.com",
    password: "password123",
    role: "user",
  },
  {
    name: "Siti Rahayu",
    email: "siti@test.com",
    password: "password123",
    role: "user",
  },
  {
    name: "Andi Pratama",
    email: "andi@test.com",
    password: "password123",
    role: "user",
  },
  {
    name: "Dewi Lestari",
    email: "dewi@test.com",
    password: "password123",
    role: "user",
  },
]

// ---- Main ----

async function seed() {
  console.log("🔗 Menghubungkan ke MongoDB...")
  await mongoose.connect(MONGODB_URI!)
  console.log("✅ Terhubung!\n")

  let created = 0
  let skipped = 0

  for (const userData of usersToSeed) {
    let user = await UserModel.findOne({ email: userData.email })

    if (!user) {
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      user = await UserModel.create({
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role,
      })
      console.log(`✅ Dibuat: ${userData.name} <${userData.email}> [${userData.role}]`)
      created++
    } else {
      console.log(`⏩ Skip user: ${userData.email} (sudah ada)`)
      skipped++
    }

    // Seed categories jika belum punya
    const catCount = await CategoryModel.countDocuments({ userId: user._id })
    if (catCount === 0) {
      const categories = defaultCategories.map((cat) => ({ ...cat, userId: user._id }))
      await CategoryModel.insertMany(categories)
      console.log(`   └─ ✅ Kategori default ditambahkan`)
    } else {
      console.log(`   └─ ⏩ Skip kategori (sudah ada ${catCount})`)
    }
  }

  console.log(`\n📊 Selesai: ${created} dibuat, ${skipped} dilewati`)
  console.log("\n🔑 Akun yang tersedia:")
  console.log("  ADMIN  → admin@kanebo.com   / admin123")
  console.log("  DEMO   → demo@kanebo.com    / demo123")
  console.log("  USER   → budi@test.com      / password123")
  console.log("  USER   → siti@test.com      / password123")
  console.log("  USER   → andi@test.com      / password123")
  console.log("  USER   → dewi@test.com      / password123")

  await mongoose.disconnect()
  console.log("\n🔌 Disconnected. Done!")
}

seed().catch((err) => {
  console.error("❌ Seed gagal:", err)
  process.exit(1)
})
