import { NextResponse } from "next/server"
import { isFirstUser } from "@/lib/setup"

export async function GET() {
    try {
        const firstUser = await isFirstUser()
        return NextResponse.json({ isFirstUser: firstUser })
    } catch (error) {
        console.error("Setup check error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
