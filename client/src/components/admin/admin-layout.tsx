import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/vehicles", label: "Vehicles" },
    { href: "/admin/settings", label: "Settings" }
  ];

  return (
    <div className="min-h-screen grid grid-cols-[240px,1fr]">
      <aside className="bg-muted border-r p-4">
        <Link href="/admin" className="flex items-center gap-2 text-lg font-semibold mb-8">
          Admin Panel
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block px-4 py-2 rounded-md text-sm",
                location === item.href
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="p-8">
        {children}
      </main>
    </div>
  );
}