"use client";

import { Badge } from "@/components/ui/badge";

function formatDate(iso) {
    try {
        return new Date(iso).toLocaleString();
    } catch (e) {
        return iso;
    }
}

function SmallJSON({ object }) {
    return (
        <pre className="bg-muted/50 rounded-md p-3 text-xs font-mono overflow-auto max-h-48 border border-border/50">
            {JSON.stringify(object, null, 2)}
        </pre>
    );
}

function FieldDiff({ label, before, after }) {
    if (before === after) return null;
    return (
        <div className="grid grid-cols-[100px_1fr_1fr] gap-2 text-sm border-b border-border/40 py-2 last:border-0">
            <div className="text-muted-foreground font-medium">{label}</div>
            <div className="text-red-500/80 bg-red-500/10 px-2 py-0.5 rounded line-through w-fit h-fit text-xs">
                {String(before ?? '—')}
            </div>
            <div className="text-green-600 bg-green-500/10 px-2 py-0.5 rounded w-fit h-fit text-xs font-medium">
                {String(after ?? '—')}
            </div>
        </div>
    );
}

export default function AuditLogDetails({ details, action }) {
    if (!details) return <span className="text-muted-foreground italic">No details available</span>;

    // Case: Deleted Record
    if (details.deleted) {
        const d = details.deleted;
        return (
            <div className="space-y-3 bg-card border rounded-lg p-4 shadow-sm">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Deleted Record Snapshot</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Name</div>
                        <div className="font-medium text-sm">{d.name || '—'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Email</div>
                        <div className="font-medium text-sm">{d.email || '—'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Role</div>
                        <div className="inline-flex">
                            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded capitalize">{d.role || '—'}</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">ID</div>
                        <div className="font-mono text-xs text-muted-foreground truncate" title={d._id}>{d._id}</div>
                    </div>
                </div>

                <div className="pt-2 border-t mt-2">
                    <div className="text-xs text-muted-foreground mb-1">Raw Data</div>
                    <SmallJSON object={d} />
                </div>
            </div>
        );


    }

    // Case: Created Record
    if (details.created) {
        const c = details.created;
        return (
            <div className="space-y-3 bg-card border rounded-lg p-4 shadow-sm">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">New Record Created</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Name</div>
                        <div className="font-medium text-sm">{c.name || '—'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Email</div>
                        <div className="font-medium text-sm">{c.email || '—'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Role</div>
                        <div className="inline-flex">
                            <span className="bg-green-500/10 text-green-700 text-xs px-2 py-0.5 rounded capitalize">{c.role || '—'}</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">ID</div>
                        <div className="font-mono text-xs text-muted-foreground truncate" title={c._id}>{c._id}</div>
                    </div>
                </div>

                <div className="pt-2 border-t mt-2">
                    <div className="text-xs text-muted-foreground mb-1">Raw Data</div>
                    <SmallJSON object={c} />
                </div>
            </div>
        );
    }

    // Case: Update (Before vs After)
    if (details.before || details.after) {
        const before = details.before || {};
        const after = details.after || {};

        // Calculate changed keys for a cleaner view
        const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
        const changedKeys = Array.from(allKeys).filter(k =>
            k !== 'updatedAt' && k !== '__v' && JSON.stringify(before[k]) !== JSON.stringify(after[k])
        );

        return (
            <div className="space-y-3 bg-card border rounded-lg p-4 shadow-sm">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Changes</h4>

                {changedKeys.length > 0 ? (
                    <div className="rounded-md border bg-background/50">
                        <div className="grid grid-cols-[100px_1fr_1fr] gap-2 px-3 py-2 bg-muted/30 text-xs font-semibold text-muted-foreground border-b">
                            <div>Field</div>
                            <div>Before</div>
                            <div>After</div>
                        </div>
                        <div className="px-3">
                            {changedKeys.map(key => (
                                <FieldDiff key={key} label={key} before={before[key]} after={after[key]} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">No specific field changes detected (possibly internal update).</div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Full state before</div>
                        <SmallJSON object={before} />
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Full state after</div>
                        <SmallJSON object={after} />
                    </div>
                </div>
            </div>
        );
    }

    // Generic render for creation or other events
    return (
        <div className="space-y-2 bg-card border rounded-lg p-4 shadow-sm">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Event Data</h4>
            <SmallJSON object={details} />
        </div>
    );
}

