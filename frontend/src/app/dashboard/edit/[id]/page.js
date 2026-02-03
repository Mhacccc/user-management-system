"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getUser, updateUser, removeToken } from "@/lib/api";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

// Decodes JWT (client-side only for UI logic)
const parseJwt = (token) => {
    try {
        const payload = token.split('.')[1];
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
};

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [user, setUser] = useState({ name: "", email: "", role: "user" });
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                if (!token) {
                    router.push("/login");
                    return;
                }
                const decoded = parseJwt(token);
                setCurrentUser({ id: decoded?.id || decoded?.sub, role: decoded?.role });

                const res = await getUser(params.id);
                setUser(res.data);
            } catch (err) {
                const status = err?.response?.status;
                if (status === 401) {
                    removeToken();
                    router.push("/login");
                    return;
                }
                setError(err?.response?.data?.message || "Failed to load user data");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchUser();
    }, [params.id, router]);

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            // Filter out empty password if not changing
            const dataToSend = { ...user };
            if (!dataToSend.password) delete dataToSend.password;

            await updateUser(params.id, dataToSend);
            router.push("/dashboard");
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to update user");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading user details...</div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-muted/30 px-4 py-8">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] gap-8">
                <div>
                    <Sidebar />
                </div>

                <div className="flex justify-center md:block">
                    <Card className="w-full max-w-lg shadow-md border-border/60">
                        <CardHeader>
                            <CardTitle>Edit User Profile</CardTitle>
                            <CardDescription>Update details for {user.name || 'this user'}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        onChange={handleChange}
                                        value={user.name}
                                        required
                                        className="bg-background"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        onChange={handleChange}
                                        value={user.email}
                                        required
                                        className="bg-background"
                                    />
                                </div>

                                {/* Only Admin can change Roles */}
                                {currentUser?.role === 'admin' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <div className="relative">
                                            <select
                                                id="role"
                                                name="role"
                                                value={user.role}
                                                onChange={handleChange}
                                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <svg className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                        <p className="text-[0.8rem] text-muted-foreground">Admins have full access to all system resources.</p>
                                    </div>
                                )}

                                <div className="pt-4 flex items-center justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={saving}>
                                        {saving ? (
                                            <>
                                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                                                Saving...
                                            </>
                                        ) : "Save Changes"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
