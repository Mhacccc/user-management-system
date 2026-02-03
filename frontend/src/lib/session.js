export const sessionOptions = {
    password: process.env.SESSION_SECRET,
    cookieName: "user_session",
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
    },
};
