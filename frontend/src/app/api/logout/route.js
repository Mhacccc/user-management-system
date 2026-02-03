import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST() {
    const sessionCookie = await cookies();
    const session = await getIronSession(sessionCookie, sessionOptions);

    session.destroy();

    return Response.json({ message: "Logged out successfully" });
}
