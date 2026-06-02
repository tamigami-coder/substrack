import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./db"

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "ログイン",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const existing = await prisma.user.findUnique({ where: { email: credentials.email } })

        if (!existing) {
          // 初回登録：ハッシュ化して保存
          const hashed = await bcrypt.hash(credentials.password, 10)
          const user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split("@")[0],
              password: hashed,
            },
          })
          return { id: user.id, email: user.email, name: user.name }
        }

        // 既存ユーザー：パスワード照合
        if (!existing.password) return null
        const ok = await bcrypt.compare(credentials.password, existing.password)
        if (!ok) return null
        return { id: existing.id, email: existing.email, name: existing.name }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) token.id = user.id
      return token
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
      },
    }),
  },
  pages: {
    signIn: "/auth/signin",
  },
}
