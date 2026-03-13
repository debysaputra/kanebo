import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Dijalankan di Edge (proxy.ts) — tidak boleh pakai DB
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "user"
      }
      return token
    },
    // Diperlukan agar auth.user.role tersedia di authorized callback
    session({ session, token }) {
      session.user.role = (token.role as string) ?? "user"
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      const isAuthPage = pathname.startsWith("/login")
      const isApiAuth = pathname.startsWith("/api/auth")
      const isAdminRoute =
        pathname.startsWith("/admin") || pathname.startsWith("/api/admin")

      if (isApiAuth) return true
      if (!isLoggedIn && !isAuthPage) return false
      if (isLoggedIn && isAuthPage) return Response.redirect(new URL("/", nextUrl))

      // Blokir akses admin untuk non-admin
      if (isAdminRoute && auth?.user?.role !== "admin") {
        return Response.redirect(new URL("/", nextUrl))
      }

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
