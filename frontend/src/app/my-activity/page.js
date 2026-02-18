"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyActivity, getUserSession } from "@/lib/api";
import Sidebar from "@/components/sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AuditLogDetails from "@/components/audit-log-details";

// Icons
const Icons = {
    Plus: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
    ),
    Edit: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
    ),
    Trash: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
    ),
    Shield: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    ),
    User: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    ),
};

function formatDate(iso) {
    try {
        return new Date(iso).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit'
        });
    } catch (e) {
        return iso;
    }
}

function getActionStyle(action) {
    const act = String(action).toLowerCase();
    switch (act) {
        case 'create':
            return { color: 'text-green-600 bg-green-500/10 border-green-200/50', icon: <Icons.Plus className="w-3.5 h-3.5" /> };
        case 'update':
            return { color: 'text-blue-600 bg-blue-500/10 border-blue-200/50', icon: <Icons.Edit className="w-3.5 h-3.5" /> };
        case 'delete':
            return { color: 'text-red-600 bg-red-500/10 border-red-200/50', icon: <Icons.Trash className="w-3.5 h-3.5" /> };
        default:
            return { color: 'text-gray-600 bg-gray-500/10 border-gray-200/50', icon: null };
    }
}

function getActorIcon(type) {
    switch (String(type).toLowerCase()) {
        case 'admin': return <Icons.Shield className="w-3.5 h-3.5" />;
        default: return <Icons.User className="w-3.5 h-3.5" />;
    }
}

export default function MyActivityPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState({ id: null, role: null });
    const [query, setQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [expanded, setExpanded] = useState({});
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();

    // Load cached role on mount to avoid hydration mismatch
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const cachedRole = localStorage.getItem('userRole');
            const cachedId = localStorage.getItem('userId');
            if (cachedRole && !currentUser.role) {
                setCurrentUser({ id: cachedId || null, role: cachedRole });
            }
        }
    }, []);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                // Fetch current session user
                const sessionRes = await getUserSession();
                if (sessionRes.data?.user) {
                    setCurrentUser(sessionRes.data.user);
                    // Cache user role in localStorage
                    localStorage.setItem('userRole', sessionRes.data.user.role);
                    localStorage.setItem('userId', sessionRes.data.user.id);
                }

                const res = await getMyActivity();
                const sorted = (res.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setLogs(sorted);
            } catch (err) {
                const status = err?.response?.status;
                if (status === 401 || status === 403) {
                    router.push('/login');
                } else {
                    setError(err?.response?.data?.error || 'Failed to load activity');
                }
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [router]);

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Filter logs
    const filtered = logs.filter(log => {
        const matchesQuery = !query ||
            log.message?.toLowerCase().includes(query.toLowerCase()) ||
            log.actor?.name?.toLowerCase().includes(query.toLowerCase()) ||
            log.target?.name?.toLowerCase().includes(query.toLowerCase());

        const matchesAction = actionFilter === 'all' || log.action === actionFilter;

        return matchesQuery && matchesAction;
    });

    return (
        <div className="min-h-[calc(100vh-64px)] bg-muted/30 px-4 py-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] gap-8">
                <div>
                    <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} userRole={currentUser?.role} />
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">My Activity</h1>
                                <p className="text-muted-foreground mt-1">Your personal account activity history</p>
                            </div>
                        </div>
                    </div>

                    <Card className="border-border/60 shadow-sm bg-card/80 backdrop-blur-sm">
                        <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                {/* Search */}
                                <div className="relative w-full sm:w-[280px]">
                                    <Input
                                        placeholder="Search your activity..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="pl-9 bg-background"
                                    />
                                    <svg className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>

                                {/* Action Filter */}
                                <select
                                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                    value={actionFilter}
                                    onChange={(e) => setActionFilter(e.target.value)}
                                >
                                    <option value="all">All Actions</option>
                                    <option value="create">Created</option>
                                    <option value="update">Updated</option>
                                    <option value="delete">Deleted</option>
                                </select>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-4 space-y-4">
                                    <div className="animate-pulse">
                                        <div className="h-8 bg-muted/30 rounded w-1/3 mb-4"></div>
                                        <div className="grid gap-3">
                                            {Array.from({ length: 6 }).map((_, i) => (
                                                <div key={i} className="flex items-start gap-4">
                                                    <div className="h-8 w-8 rounded-full bg-muted/20"></div>
                                                    <div className="flex-1">
                                                        <div className="h-4 bg-muted/20 rounded w-1/2 mb-2"></div>
                                                        <div className="h-3 bg-muted/20 rounded w-1/3"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="p-8 text-center text-red-500">{error}</div>
                            ) : filtered.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="mb-4 text-muted-foreground/30">
                                        <svg className="w-16 h-16 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                                    <p className="text-sm text-muted-foreground">Your account changes and updates will appear here.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/40">
                                    {filtered.map((log) => {
                                        const { color, icon } = getActionStyle(log.action);
                                        const actorIcon = getActorIcon(log.actorType);
                                        const isExpanded = expanded[log._id];

                                        return (
                                            <div key={log._id} className="p-4 hover:bg-muted/20 transition-colors">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <Badge variant="outline" className={`${color} border px-2 py-0.5 text-xs font-medium flex items-center gap-1`}>
                                                                {icon}
                                                                {log.action}
                                                            </Badge>
                                                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                                                                {actorIcon}
                                                                {log.actorType}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
                                                        </div>
                                                        <p className="text-sm text-foreground/90 mb-1">{log.message || 'Activity recorded'}</p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            {log.actor && (
                                                                <span>
                                                                    By: <span className="font-medium text-foreground/70">{log.actor.name || log.actor.email}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {log.details && (
                                                        <button
                                                            onClick={() => toggleExpand(log._id)}
                                                            className="text-xs text-primary hover:underline whitespace-nowrap"
                                                        >
                                                            {isExpanded ? 'Hide Details' : 'View Details'}
                                                        </button>
                                                    )}
                                                </div>
                                                {isExpanded && log.details && (
                                                    <div className="mt-3 pl-0">
                                                        <AuditLogDetails details={log.details} action={log.action} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {!loading && filtered.length > 0 && (
                        <div className="text-center text-sm text-muted-foreground">
                            Showing {filtered.length} {filtered.length === 1 ? 'activity' : 'activities'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
