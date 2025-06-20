import NextAuth, { DefaultSession } from "next-auth"
import { UserRole } from "@/lib/abilities"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: UserRole
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        email: string
        name?: string | null
        role: UserRole
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
    }
}
