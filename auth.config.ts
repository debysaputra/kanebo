import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "user"
      }
      return token
    },
    session({ session, token }) {
      session.user.role = (token.role as string) ?? "user"
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      const isAuthPage = pathname.startsWith("/login")
      const isApiRoute = pathname.startsWith("/api/")
      const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/")

      // Biarkan semua API route handle auth sendiri (kembalikan JSON, bukan redirect)
      if (isApiRoute) return true

      if (!isLoggedIn && !isAuthPage) return false
      if (isLoggedIn && isAuthPage) return Response.redirect(new URL("/", nextUrl))

      // Guard halaman /admin — non-admin redirect ke home
      if (isAdminPage && auth?.user?.role !== "admin") {
        return Response.redirect(new URL("/", nextUrl))
      }

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
