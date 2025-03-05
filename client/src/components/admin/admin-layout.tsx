import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  Settings,
  Gavel,
  Calendar,
  MessageSquare,
  Wrench,
  PackageOpen,
  Tag,
  PiggyBank
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/vehicles", label: "Vehicles", icon: Car },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/settings", label: "Settings", icon: Settings },
    { href: "/admin/auctions", label: "Auctions", icon: Gavel },
    { href: "/admin/events", label: "Events", icon: Calendar },
    { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
    { href: "/admin/spare-parts", label: "Spare Parts", icon: Wrench },
    { href: "/admin/inventory", label: "Inventory", icon: PackageOpen },
    { href: "/admin/offers", label: "Offers", icon: Tag },
    { href: "/admin/pricing", label: "Pricing", icon: PiggyBank }
  ];

  return (
    <div className="min-h-screen grid grid-cols-[240px,1fr]">
      <aside className="bg-muted border-r p-4">
        <Link href="/admin" className="flex items-center gap-2 text-lg font-semibold mb-8">
          Admin Panel
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm",
                  location === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="p-8">
        {children}
      </main>
    </div>
  );
}