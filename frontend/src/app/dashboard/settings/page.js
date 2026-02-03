"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, updateUser, getUserSession } from "@/lib/api";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // User state
    const [userId, setUserId] = useState(null);
    const [profile, setProfile] = useState({ name: "", email: "", role: "" });

    // Password state
    const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch current user from session
                const sessionRes = await getUserSession();
                const sessionUser = sessionRes.data?.user;

                if (!sessionUser) {
                    router.push("/login"); // Middleware should handle this, but double check
                    return;
                }

                setUserId(sessionUser.id);

                // Fetch full profile data
                const res = await getUser(sessionUser.id);
                setProfile(res.data);
            } catch (err) {
                const status = err?.response?.status;
                if (status === 401) {
                    router.push("/login");
                    return;
                }
                setError("Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };



        // Re-implementing correctly below using imports
        init();
    }, [router]);

    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        // Basic validation
        if (passwords.newPassword && passwords.newPassword !== passwords.confirmPassword) {
            setError("Passwords do not match.");
            setSaving(false);
            return;
        }

        try {
            const updateData = {
                name: profile.name,
                email: profile.email
            };

            if (passwords.newPassword) {
                updateData.password = passwords.newPassword;
            }

            await updateUser(userId, updateData);
            setSuccess("Profile updated successfully.");
            setPasswords({ newPassword: "", confirmPassword: "" }); // Reset password fields
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-muted/30 px-4 py-8">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] gap-8">
                <div>
                    <Sidebar />
                </div>

                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                        <p className="text-muted-foreground mt-1">Manage your personal information and security.</p>
                    </div>

                    <Card className="border-border/60 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Profile Information</CardTitle>
                                    <CardDescription>Update your public profile details.</CardDescription>
                                </div>
                                <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} className="uppercase">
                                    {profile.role}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSave} className="space-y-6">
                                {error && (
                                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="p-3 rounded-md bg-green-500/10 text-green-600 text-sm font-medium border border-green-500/20">
                                        {success}
                                    </div>
                                )}

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={profile.name}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={profile.email}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border/50">
                                    <h3 className="text-sm font-medium mb-4">Security</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">New Password</Label>
                                            <Input
                                                id="newPassword"
                                                name="newPassword"
                                                type="password"
                                                placeholder="Leave blank to keep current"
                                                value={passwords.newPassword}
                                                onChange={handlePasswordChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type="password"
                                                placeholder="Confirm new password"
                                                value={passwords.confirmPassword}
                                                onChange={handlePasswordChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? "Saving..." : "Save Changes"}
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
