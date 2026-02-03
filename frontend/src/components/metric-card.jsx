export default function MetricCard({ title, value, icon, trend }) {
    return (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                    <p className="text-3xl font-bold text-foreground">{value}</p>
                    {trend && (
                        <p className="text-xs text-muted-foreground mt-2">{trend}</p>
                    )}
                </div>
                {icon && (
                    <div className="ml-4 text-muted-foreground/40">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
