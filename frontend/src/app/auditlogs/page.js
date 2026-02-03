"use client";

import { useEffect, useState, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import { getAuditLogs, removeToken } from "@/lib/api";
import Sidebar from "@/components/sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuditLogDetails from "@/components/audit-log-details";

// Icons (Inline SVGs to avoid dependency issues if lucide is not installed)
const Icons = {
  Download: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
  ),
  Filter: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
  ),
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
  Server: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" x2="6.01" y1="6" y2="6" /><line x1="6" x2="6.01" y1="18" y2="18" /></svg>
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

// Helper to get action style and icon
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
      return { color: 'text-gray-600 bg-gray-500/10 border-gray-200/50', icon: <Icons.Filter className="w-3.5 h-3.5" /> };
  }
}

function getActorIcon(type) {
  switch (String(type).toLowerCase()) {
    case 'admin': return <Icons.Shield className="w-3.5 h-3.5" />;
    case 'system': return <Icons.Server className="w-3.5 h-3.5" />;
    default: return <Icons.User className="w-3.5 h-3.5" />;
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, 24h, 7d, 30d

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [expanded, setExpanded] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getAuditLogs();
        const sorted = (res.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLogs(sorted);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          removeToken();
          router.push('/login');
          return;
        }
        setError(err?.response?.data?.error || err?.message || 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [router]);

  // Handle filtering
  const filtered = useMemo(() => {
    return logs.filter(l => {
      // Text Search
      const searchTerms = `${l.action} ${l.message || ''} ${l.actor?.name || ''} ${l.target?.name || ''} ${l.target?.email || ''}`.toLowerCase();
      const matchesQuery = !query || searchTerms.includes(query.toLowerCase());

      // Action Filter
      const matchesAction = actionFilter === 'all' || l.action?.toLowerCase() === actionFilter;

      // Actor Filter
      const matchesActor = actorFilter === 'all' ||
        (actorFilter === 'admin' && l.actorType === 'admin') ||
        (actorFilter === 'user' && l.actorType === 'self') ||
        (actorFilter === 'system' && l.actorType === 'system');

      // Date Filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const date = new Date(l.createdAt);
        const now = new Date();
        const diffHours = (now - date) / (1000 * 60 * 60);
        if (dateFilter === '24h') matchesDate = diffHours <= 24;
        else if (dateFilter === '7d') matchesDate = diffHours <= 24 * 7;
        else if (dateFilter === '30d') matchesDate = diffHours <= 24 * 30;
      }

      return matchesQuery && matchesAction && matchesActor && matchesDate;
    });
  }, [logs, query, actionFilter, actorFilter, dateFilter]);

  // Handle pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, actionFilter, actorFilter, dateFilter]);

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  // CSV Export
  const handleExport = () => {
    const headers = ["Timestamp", "Action", "Actor_Name", "Actor_Type", "Target_Name", "Target_Email", "Message"];
    const rows = filtered.map(l => [
      new Date(l.createdAt).toISOString(),
      l.action,
      l.actor?.name || 'Deleted Account',
      l.actorType,
      l.target?.name || '',
      l.target?.email || '',
      l.message || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-muted/30 px-4 py-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] gap-8">
        <div>
          <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
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
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Logs</h1>
                <p className="text-muted-foreground mt-1">Comprehensive timeline of system activities.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0} className="gap-2">
                <Icons.Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>

          <Card className="border-border/60 shadow-sm bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
              <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Search */}
                  <div className="relative w-full sm:w-[240px]">
                    <Input
                      placeholder="Search logs..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-9 bg-background"
                    />
                    <svg className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Filters */}
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="all">Any time</option>
                    <option value="24h">Last 24 hours</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                  </select>

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

                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                    value={actorFilter}
                    onChange={(e) => setActorFilter(e.target.value)}
                  >
                    <option value="all">All Actors</option>
                    <option value="admin">Admins</option>
                    <option value="user">Users (Self)</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading && <div className="py-12 text-center text-muted-foreground animate-pulse">Loading audit history...</div>}
              {error && <div className="p-4 m-4 rounded-md bg-destructive/10 text-destructive text-sm font-medium">{error}</div>}

              {!loading && !error && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/30 text-muted-foreground/70 font-medium">
                        <tr>
                          <th className="px-4 py-3 w-[160px]">Timestamp</th>
                          <th className="px-4 py-3 w-[150px]">Action</th>
                          <th className="px-4 py-3">Actor</th>
                          <th className="px-4 py-3">Target</th>
                          <th className="px-4 py-3 w-[80px]"> </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {currentData.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-12 text-center">
                              <div className="flex flex-col items-center justify-center text-muted-foreground">
                                <Icons.Filter className="w-8 h-8 opacity-20 mb-2" />
                                <p className="font-medium">No activity found</p>
                                <p className="text-xs opacity-70">Adjust filters to see more results</p>
                              </div>
                            </td>
                          </tr>
                        )}

                        {currentData.map((l) => {
                          const style = getActionStyle(l.action);
                          return (
                            <Fragment key={l._id}>
                              <tr className={`group transition-colors ${expanded[l._id] ? 'bg-muted/40' : 'hover:bg-muted/20'}`}>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="text-foreground/90 font-medium">{formatDate(l.createdAt).split(',')[0]}</span>
                                    <span className="text-xs text-muted-foreground">{formatDate(l.createdAt).split(',')[1]}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.color}`}>
                                    {style.icon}
                                    <span className="capitalize">{l.action}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <div title={l.actorType} className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center border border-border">
                                      {getActorIcon(l.actorType)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-medium text-foreground text-xs sm:text-sm">{l.actor?.name || (l.actorType === 'self' ? 'User (Self)' : 'System')}</span>
                                      <span className="text-[10px] text-muted-foreground capitalize">{l.actorType}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col max-w-[200px]">
                                    <span className="font-medium ...">
                                      {l.target?.name || l.details?.deleted?.name || l.details?.created?.name || '—'}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground truncate" title={l.target?.email}>{l.target?.email || l.target?._id || l.details?.deleted?.email || l.details?.created?.email || '—'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggle(l._id)}
                                    className="h-8 w-8 p-0 hover:bg-background border border-transparent hover:border-border"
                                  >
                                    <svg
                                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                      className={`transition-transform duration-200 ${expanded[l._id] ? 'rotate-180' : ''}`}
                                    >
                                      <path d="M6 9l6 6 6-6" />
                                    </svg>
                                    <span className="sr-only">Toggle details</span>
                                  </Button>
                                </td>
                              </tr>

                              {expanded[l._id] && (
                                <tr className="bg-muted/40 border-b border-border/50 shadow-inner">
                                  <td colSpan={5} className="px-4 py-4 md:px-8">
                                    <div className="pl-4 border-l-2 border-primary/20">
                                      <AuditLogDetails details={l.details} action={l.action} />
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {filtered.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-4 border-t border-border/50 bg-muted/20">
                      <div className="text-xs text-muted-foreground">
                        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="h-8 text-xs"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="h-8 text-xs"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
