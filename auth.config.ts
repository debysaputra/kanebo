import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      const isAuthPage = pathname.startsWith("/login")
      const isApiAuth = pathname.startsWith("/api/auth")

      if (isApiAuth) return true
      if (!isLoggedIn && !isAuthPage) return false
      if (isLoggedIn && isAuthPage) return Response.redirect(new URL("/", nextUrl))

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
