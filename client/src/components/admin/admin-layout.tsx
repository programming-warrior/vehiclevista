import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Car,
  Users,
  Gavel,
  Ticket,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { useEffect } from "react";
import { useUser } from "@/hooks/use-store";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { userId, role } = useUser();

  useEffect(() => {
    if (role !== "admin") {
      window.location.href = "/";
    }
  }, [role, userId]);

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/vehicles", label: "Vehicles", icon: Car },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/auctions", label: "Auctions", icon: Gavel },
    { href: "/admin/raffle", label: "Raffle", icon: Ticket },
    { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
    { href: "/admin/payment-history", label: "Payment History", icon: CreditCard },
    { href: "/admin/buyer-seller-chat", label: "Buyer-Seller Chats", icon: Gavel },

  ];

  return (
    // 1. Set a fixed height for the container and hide overflow
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* The sidebar is a flex item and will not scroll */}
      <aside className="bg-white border-r border-gray-200 w-64 flex-shrink-0 shadow-sm">
        <div className="p-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-xl font-bold text-blue-700 hover:text-blue-800 transition-colors"
          >
            Admin Panel
          </Link>
        </div>
        <nav className="px-4 pb-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-blue-100 text-blue-700 shadow-sm border border-blue-200"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

    
      <main className="flex-1 min-w-0 overflow-y-auto">
  
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}