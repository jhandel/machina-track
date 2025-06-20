import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@/generated/prisma"
import bcrypt from "bcryptjs"
import { isFirstUser } from "@/lib/setup"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const { email, password, name } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            )
        }

        // Check if this is the first user or if registration is allowed
        const firstUser = await isFirstUser()

        if (!firstUser) {
            return NextResponse.json(
                { error: "Registration is not allowed. Only the first user can register." },
                { status: 403 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null,
            }
        })

        return NextResponse.json(
            {
                message: "User created successfully",
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                }
            },
            { status: 201 }
        )

    } catch (error) {
        console.error("Registration error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}