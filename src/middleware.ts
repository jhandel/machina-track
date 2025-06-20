import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function middleware(req) {
        // Let the pages handle their own logic
        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl

                // Always allow public routes
                const publicRoutes = [
                    "/setup",
                    "/auth/signin",
                    "/api/auth/register",
                    "/api/auth/setup-check",
                    "/" // Allow home page to handle redirect logic
                ]

                if (publicRoutes.includes(pathname) || pathname.startsWith("/api/auth/")) {
                    return true
                }

                // For all other routes, require authentication
                return !!token
            },
        },
    }
)

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (NextAuth routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
    ],
}
