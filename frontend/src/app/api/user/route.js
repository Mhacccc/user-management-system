import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET() {
    const sessionCookie = await cookies();
    const session = await getIronSession(sessionCookie, sessionOptions);

    if (!session.user) {
        return Response.json({ user: null, isLoggedIn: false });
    }

    return Response.json({
        user: session.user,
        isLoggedIn: true,
    });
}
