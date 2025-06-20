import { PrismaClient } from "@/generated/prisma"

const prisma = new PrismaClient()

export async function isFirstUser(): Promise<boolean> {
    try {
        const userCount = await prisma.user.count()
        return userCount === 0
    } catch (error) {
        console.error("Error checking user count:", error)
        return false
    }
}

export async function getUserCount(): Promise<number> {
    try {
        return await prisma.user.count()
    } catch (error) {
        console.error("Error getting user count:", error)
        return 0
    }
}
