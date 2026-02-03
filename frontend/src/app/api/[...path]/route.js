import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";
import { cookies } from "next/headers";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function proxyRequest(request, { params }) {
    const sessionCookie = await cookies();
    const session = await getIronSession(sessionCookie, sessionOptions);

    if (!session.token) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path } = await params; // Resolve the params promise (Next 15+ compatible)
    const queryString = request.nextUrl.search;
    const backendPath = path.join("/");
    const url = `${BACKEND_URL}/api/${backendPath}${queryString}`;

    const method = request.method;

    // Forward Body if not GET
    let body;
    if (method !== "GET" && method !== "HEAD") {
        try {
            body = await request.json();
        } catch (e) {
            // Body might be empty or not json
            body = null;
        }
    }

    try {
        const response = await axios({
            method,
            url,
            data: body,
            headers: {
                Authorization: `Bearer ${session.token}`,
                "Content-Type": "application/json",
            },
            validateStatus: () => true, // resolve promise for all status codes
        });

        return Response.json(response.data, { status: response.status });
    } catch (error) {
        console.error("Proxy Error:", error);
        return Response.json({ error: "Proxy Error" }, { status: 500 });
    }
}

export { proxyRequest as GET, proxyRequest as POST, proxyRequest as PUT, proxyRequest as DELETE };
