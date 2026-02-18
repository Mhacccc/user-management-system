"use client";

import { Badge } from "@/components/ui/badge";
import { useState } from "react";

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
        <div className="grid grid-cols-[300px_1fr_1fr] gap-2 text-sm border-b border-border/40 py-2 last:border-0">
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

// Helper function to format JSON with proper indentation
function formatJSON(obj) {
    return JSON.stringify(obj, null, 2);
}

// Helper to classify each line as added, removed, or unchanged
function getDiffLines(beforeObj, afterObj) {
    const beforeLines = formatJSON(beforeObj).split('\n');
    const afterLines = formatJSON(afterObj).split('\n');

    const maxLines = Math.max(beforeLines.length, afterLines.length);
    const diffLines = [];

    for (let i = 0; i < maxLines; i++) {
        const beforeLine = beforeLines[i] || '';
        const afterLine = afterLines[i] || '';

        let status = 'unchanged';
        if (beforeLine !== afterLine) {
            if (!beforeLine) status = 'added';
            else if (!afterLine) status = 'removed';
            else status = 'modified';
        }

        diffLines.push({
            lineNum: i + 1,
            before: beforeLine,
            after: afterLine,
            status
        });
    }

    return diffLines;
}

// DiffLine component for rendering individual lines
function DiffLine({ lineNum, before, after, status }) {
    const getLineStyle = (side) => {
        if (status === 'unchanged') {
            return 'bg-muted/10 text-muted-foreground/70';
        }
        if (status === 'modified') {
            return side === 'before'
                ? 'bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-300 border-l-2 border-red-500'
                : 'bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-300 border-l-2 border-green-500';
        }
        if (status === 'removed' && side === 'before') {
            return 'bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-300 border-l-2 border-red-500';
        }
        if (status === 'added' && side === 'after') {
            return 'bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-300 border-l-2 border-green-500';
        }
        return 'bg-muted/5';
    };

    return (
        <div className="grid grid-cols-2 gap-px text-xs font-mono">
            <div className={`flex ${getLineStyle('before')} px-2 py-0.5`}>
                <span className="text-muted-foreground/40 select-none mr-3 w-8 text-right">{lineNum}</span>
                <span className="flex-1 whitespace-pre">{before || ' '}</span>
            </div>
            <div className={`flex ${getLineStyle('after')} px-2 py-0.5`}>
                <span className="text-muted-foreground/40 select-none mr-3 w-8 text-right">{lineNum}</span>
                <span className="flex-1 whitespace-pre">{after || ' '}</span>
            </div>
        </div>
    );
}

// Main DiffViewer component
function DiffViewer({ before, after }) {
    const [showRawJSON, setShowRawJSON] = useState(false);
    const diffLines = getDiffLines(before, after);

    // Count changes
    const changes = diffLines.filter(line => line.status !== 'unchanged').length;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    {changes} {changes === 1 ? 'line' : 'lines'} changed
                </div>
                <button
                    onClick={() => setShowRawJSON(!showRawJSON)}
                    className="text-xs text-primary hover:underline"
                >
                    {showRawJSON ? 'Show Diff View' : 'Show Raw JSON'}
                </button>
            </div>

            {showRawJSON ? (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-xs text-muted-foreground mb-1 font-medium">Before</div>
                        <SmallJSON object={before} />
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-1 font-medium">After</div>
                        <SmallJSON object={after} />
                    </div>
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden bg-background">
                    {/* Header */}
                    <div className="grid grid-cols-2 gap-px bg-muted/30 border-b">
                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                            Before
                        </div>
                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                            After
                        </div>
                    </div>

                    {/* Diff Lines */}
                    <div className="max-h-96 overflow-auto">
                        {diffLines.map((line, idx) => (
                            <DiffLine
                                key={idx}
                                lineNum={line.lineNum}
                                before={line.before}
                                after={line.after}
                                status={line.status}
                            />
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="border-t bg-muted/20 px-3 py-2 flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-red-100 dark:bg-red-950/30 border border-red-500 rounded"></div>
                            <span className="text-muted-foreground">Removed</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-green-100 dark:bg-green-950/30 border border-green-500 rounded"></div>
                            <span className="text-muted-foreground">Added</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-muted/20 border border-border rounded"></div>
                            <span className="text-muted-foreground">Unchanged</span>
                        </div>
                    </div>
                </div>
            )}
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

    // Case: Update (Before vs After) - ENHANCED WITH DIFF VIEWER
    if (details.before || details.after) {
        const before = details.before || {};
        const after = details.after || {};

        // Calculate changed keys for a cleaner view
        const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
        const changedKeys = Array.from(allKeys).filter(k =>
            k !== 'updatedAt' && k !== '__v' && JSON.stringify(before[k]) !== JSON.stringify(after[k])
        );

        return (
            <div className="space-y-4 bg-card border rounded-lg p-4 shadow-sm">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Changes</h4>

                {/* Field-level summary */}
                {changedKeys.length > 0 && (
                    <div className="rounded-md border bg-background/50">
                        <div className="grid grid-cols-[300px_1fr_1fr] gap-2 px-3 py-2 bg-muted/30 text-xs font-semibold text-muted-foreground border-b">
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
                )}

                {/* Advanced Diff Viewer */}
                <div>
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Detailed Comparison
                    </h5>
                    <DiffViewer before={before} after={after} />
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

