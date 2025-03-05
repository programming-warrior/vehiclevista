import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Gavel,
  Calendar,
  MessageSquare,
  Wrench,
  PackageOpen,
  Tag,
  PiggyBank,
  LayoutDashboard
} from "lucide-react";

const menuItems = [
  { 
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin"
  },
  {
    title: "Auction Management",
    icon: Gavel,
    href: "/admin/auctions"
  },
  {
    title: "Event Management",
    icon: Calendar,
    href: "/admin/events"
  },
  {
    title: "Feedback Management",
    icon: MessageSquare,
    href: "/admin/feedback"
  },
  {
    title: "Spare Part Management",
    icon: Wrench,
    href: "/admin/spare-parts"
  },
  {
    title: "Inventory Management",
    icon: PackageOpen,
    href: "/admin/inventory"
  },
  {
    title: "Offer Management",
    icon: Tag,
    href: "/admin/offers"
  },
  {
    title: "Pricing Management",
    icon: PiggyBank,
    href: "/admin/pricing"
  }
];

export default function AdminSidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-gray-50 border-r h-screen p-4">
      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
