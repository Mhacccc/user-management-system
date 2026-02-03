"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUsers, deleteUser, createUser, getUserSession, getDashboardStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Sidebar from "@/components/sidebar";
import { Badge } from "@/components/ui/badge";
import MetricCard from "@/components/metric-card";
import EmptyState from "@/components/empty-state";

export default function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState({ id: null, role: 'user' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setStatsLoading(true);
      try {
        // Fetch current session user
        const sessionRes = await getUserSession();
        if (sessionRes.data?.user) {
          setCurrentUser(sessionRes.data.user);
        }

        // Fetch users and stats concurrently
        const [usersRes, statsRes] = await Promise.all([
          getUsers(),
          getDashboardStats()
        ]);

        setUsers(usersRes.data || []);
        setStats(statsRes.data || null);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          router.push("/login");
          return;
        }
        setError(err?.response?.data?.error || err?.message || "Failed to load users");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
        setStatsLoading(false);
      }
    };

    fetchData();
  }, [router]);


  const handleEdit = (id) => {
    router.push(`/dashboard/edit/${id}`);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete user');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.email || !form.password) {
      setFormError('Name, email and password are required');
      return;
    }
    setFormLoading(true);
    try {
      await createUser(form);
      const res = await getUsers();
      setUsers(res.data || []);
      setShowAddModal(false);
      setForm({ name: '', email: '', password: '', role: 'user' });
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const getInitials = (name, email) => {
    if (name) return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
    if (email) return email[0].toUpperCase();
    return "U";
  };

  const filtered = users.filter(u => {
    if (!query) return true;
    return `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="min-h-[calc(100vh-64px)] bg-muted px-4 py-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
        <div>
          <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} userRole={currentUser?.role} />
        </div>

        <div>
          {/* Header with hamburger menu */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* Hamburger menu button for mobile */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden text-foreground hover:text-foreground/80"
                aria-label="Open menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <div>
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage users, roles and access.</p>
              </div>
            </div>


          </div>

          {/* Metric Cards */}
          {!statsLoading && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard
                title="Total Users"
                value={stats.totalUsers}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
              />
              <MetricCard
                title="Admins"
                value={stats.adminCount}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                }
              />
              <MetricCard
                title="Users"
                value={stats.userCount}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
              />
              <MetricCard
                title="New (24h)"
                value={stats.newUsers}
                trend={`${stats.recentActivity} recent activities`}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                }
              />
            </div>
          )}

          {/* Mobile search bar */}
          <div className="sm:hidden mb-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50"
            />
          </div>

          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => setShowAddModal(false)} />
              <div className="relative z-10 w-full max-w-md rounded-xl bg-background p-6 shadow-2xl border border-input/20">
                <h2 className="text-lg font-semibold mb-2">Create user</h2>
                <p className="text-sm text-muted-foreground mb-4">Provide a name, email, and temporary password.</p>
                {formError && <p className="text-sm text-red-500 mb-2">{formError}</p>}
                <form onSubmit={handleCreateUser} className="space-y-3">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" value={form.name} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <select id="role" name="role" value={form.role} onChange={handleChange} className="w-full rounded-md border px-3 py-2">
                      <option value="user" className="text-neutral-600">User</option>
                      <option value="admin" className="text-neutral-600">Admin</option>
                    </select>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                    <Button type="submit" disabled={formLoading}>{formLoading ? 'Creating...' : 'Create'}</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>

              <div className="flex flex-row justify-between items-center gap-3">
                <CardTitle>Users</CardTitle>
                <div className="flex flex-row justify-end items-center gap-3">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search users..."
                    className="hidden sm:block rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50"
                  />
                  {currentUser?.role === 'admin' && <Button onClick={() => setShowAddModal(true)}>Add User</Button>}
                </div>

              </div>
            </CardHeader>
            <CardContent>
              {loading && <p>Loading users...</p>}
              {error && <p className="text-sm text-red-500">{error}</p>}

              {!loading && !error && (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-3 text-sm text-muted-foreground">Name</th>
                        <th className="py-3 text-sm text-muted-foreground">Email</th>
                        <th className="py-3 text-sm text-muted-foreground">Role</th>
                        {currentUser?.role === 'admin' && <th className="py-3 text-sm text-muted-foreground">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={4}>
                            <EmptyState
                              title="No users found"
                              description={users.length === 0 ? "Get started by creating your first user account." : "Try adjusting your search query."}
                              action={users.length === 0 && currentUser?.role === 'admin' ? "Create your first user" : null}
                              onAction={users.length === 0 && currentUser?.role === 'admin' ? () => setShowAddModal(true) : null}
                            />
                          </td>
                        </tr>
                      )}
                      {filtered.map((u) => (
                        <tr key={u._id} className="hover:bg-accent/20 transition-colors">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-input/30 flex items-center justify-center text-sm font-medium">{getInitials(u.name, u.email)}</div>
                              <div>
                                <div className="font-medium">{u.name || "—"}</div>
                                <div className="text-xs text-muted-foreground">{u._id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-sm text-muted-foreground">{u.email || "—"}</td>
                          <td className="py-4">
                            <Badge variant={u.role === 'admin' ? 'default' : 'primary'}>{u.role}</Badge>
                          </td>
                          <td className="py-4">
                            {currentUser?.role === 'admin' && (
                              <div className="flex gap-2">
                                {currentUser?.id !== u._id && <Button size="sm" onClick={() => handleEdit(u._id)}>Edit</Button>}
                                {currentUser?.id !== u._id && <Button size="sm" variant="destructive" onClick={() => handleDelete(u._id)}>Delete</Button>}
                              </div>
                            )}

                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
