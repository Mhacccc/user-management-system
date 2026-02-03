import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 flex-col gap-6 bg-transparent pr-6">
      <div className="pt-6 pb-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="font-semibold">User Management  </span>
        </Link>
      </div>

      <nav className="flex flex-col gap-1 text-sm">
        <Link href="/dashboard" className="px-3 py-2 rounded-md hover:bg-accent/40">Dashboard</Link>
        <Link href="/auditlogs" className="px-3 py-2 rounded-md hover:bg-accent/40">Audit Logs</Link>
        <Link href="/dashboard/settings" className="px-3 py-2 rounded-md hover:bg-accent/40">Settings</Link>
      </nav>

      <div className="mt-auto text-xs text-muted-foreground">© {new Date().getFullYear()} — Built with care</div>
    </aside>
  );
}
