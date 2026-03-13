import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/mongodb"
import User from "@/models/User"
import { authConfig } from "@/auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          await connectDB()
          const user = await User.findOne({ username: credentials.username }).select("+password")

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user._id.toString(),
            name: user.name,
            username: user.username,
            role: user.role,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        // Login baru — set dari data login
        token.id = user.id
        token.role = (user as { role?: string }).role ?? "user"
        token.username = (user as { username?: string }).username ?? ""
        return token
      }

      // Setiap request — re-fetch dari DB agar role selalu up to date
      // (menangani stale session & perubahan role oleh admin)
      if (token.id) {
        await connectDB()
        const dbUser = await User.findById(token.id)
          .lean() as { role?: string; username?: string } | null
        if (dbUser) {
          token.role = dbUser.role ?? "user"
          token.username = dbUser.username ?? ""
        } else {
          // User tidak ditemukan di DB — hapus id untuk invalidate session
          delete token.id
        }
      }
      return token
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) ?? "user"
        session.user.username = (token.username as string) ?? ""
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
})
