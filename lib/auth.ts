import { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter" 
import { prisma } from "@/lib/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }), 
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" , placeholder : "***********"}
      },
      authorize: async (credentials) => {
        try {
          console.log("[AUTH] Authorize called with email:", credentials?.email)
          
          if(!credentials?.email || !credentials?.password) {
            console.log("[AUTH] Missing email or password")
            return null
          }
          
          console.log("[AUTH] Querying user from database...")
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if(!user) {
            console.log("[AUTH] User not found for email:", credentials.email)
            return null
          }

          if(!user.password) {
            console.log("[AUTH] User has no password set")
            return null
          }

          console.log("[AUTH] Comparing passwords...")
          const isCorrectPassword = await bcrypt.compare(credentials.password, user.password)

          if(!isCorrectPassword) {
            console.log("[AUTH] Password incorrect")
            return null
          }

          console.log("[AUTH] Auth successful, returning user:", user.id)
          return user;
        } catch (error) {
          console.error("[AUTH] Credentials authorize error:", error)
          return null
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  }, 
  callbacks: {
    // Create ClientProfile on first OAuth login and allow credentials login
    async signIn({ user, account }) {
      try {
        // Only for OAuth providers (GitHub, Google)
        if (account?.provider === "github" || account?.provider === "google") {
          // Check if ClientProfile exists
          const existingProfile = await prisma.clientProfile.findUnique({
            where: { userId: user.id }
          })
          
          // Create if doesn't exist
          if (!existingProfile) {
            await prisma.clientProfile.create({
              data: {
                userId: user.id
              }
            })
          }
        }
        // For credentials, just allow login (no additional setup needed)
        return true
      } catch (error) {
        console.error("SignIn error:", error)
        return false
      }
    },
    // This helper makes the user ID and role available to your dashboard later
    async jwt({ token, user }) {  
      try {
        if (user) {
          token.id = user.id;
          // Fetch role from database
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id }
          });
          token.role = dbUser?.role || "client";
        }
        return token;
      } catch (error) {
        console.error("JWT callback error:", error)
        return token
      }
    },
    session: async ({ session, token }) => {
      try {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
        }
        return session;
      } catch (error) {
        console.error("Session callback error:", error)
        return session
      }
    },
  },
  pages: {
    signIn: '/login',
  },
}