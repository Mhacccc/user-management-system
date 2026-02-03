import Link from "next/link";
import { logout } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function Sidebar({ isOpen, onClose, userRole }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login"); // Force navigation to login after logout
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 lg:w-72 flex-col gap-6 bg-background md:bg-transparent pr-6 pl-6 md:pl-0
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:flex
        border-r md:border-r-0
      `}>
        <div className="pt-6 pb-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="font-semibold">User Management</span>
          </Link>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden text-muted-foreground hover:text-foreground"
            aria-label="Close menu"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1 text-sm">
          <Link
            href="/dashboard"
            className="px-3 py-2 rounded-md hover:bg-accent/40"
            onClick={onClose}
          >
            Dashboard
          </Link>

          {/* Admin-only: Audit Logs */}
          {userRole === 'admin' && (
            <Link
              href="/auditlogs"
              className="px-3 py-2 rounded-md hover:bg-accent/40"
              onClick={onClose}
            >
              Audit Logs
            </Link>
          )}

          {/* Regular users: My Activity */}
          {userRole === 'user' && (
            <Link
              href="/my-activity"
              className="px-3 py-2 rounded-md hover:bg-accent/40"
              onClick={onClose}
            >
              My Activity
            </Link>
          )}
          <Link
            href="/dashboard/settings"
            className="px-3 py-2 rounded-md hover:bg-accent/40"
            onClick={onClose}
          >
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-md hover:bg-accent/40 text-left cursor-pointer"
          >
            Logout
          </button>
        </nav>

        <div className="mt-auto text-xs text-muted-foreground">© {new Date().getFullYear()} — Built with care</div>
      </aside>
    </>
  );
}
