import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import { cookies } from "next/headers";
import axios from "axios";

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Call backend login
        // Use the backend URL from env or default
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        // We need to handle the case where the backend might return errors
        let backendRes;
        try {
            backendRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
                email,
                password,
            });
        } catch (error) {
            if (error.response) {
                return Response.json(
                    { error: error.response.data.message || error.response.data.error || "Login failed" },
                    { status: error.response.status }
                );
            }
            throw error;
        }

        const { token, user } = backendRes.data;

        // Start iron-session
        const sessionCookie = await cookies();
        const session = await getIronSession(sessionCookie, sessionOptions);

        // Save data to session
        session.token = token;
        session.user = user;
        await session.save();

        return Response.json({ user, message: "Logged in successfully" });
    } catch (error) {
        console.error("Login API Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
