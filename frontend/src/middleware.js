import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "./lib/session";
import { cookies } from "next/headers";

export async function middleware(request) {
    const sessionCookie = await cookies();
    const session = await getIronSession(sessionCookie, sessionOptions);

    const { pathname } = request.nextUrl;

    // Define protected routes
    const protectedRoutes = ["/dashboard", "/auditlogs", "/settings"];
    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

    if (isProtected && !session.user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Redirect to dashboard if logged in and trying to access login/signup
    if ((pathname === "/login" || pathname === "/signup") && session.user) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/auditlogs/:path*", "/login", "/signup"],
};
