import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Car, ChevronDown, Search } from "lucide-react";
import SearchBar from "./search-bar";
import { useAuth } from "@/hooks/use-auth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="border-b">
      {/* Top Navigation */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Car className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-primary">Auto World Trader</span>
        </Link>

        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Your Next Car, Just a Smart Search Away"
              className="w-full h-10 pl-4 pr-10 rounded-full border border-input bg-background"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            UK <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">Need Help?</Button>
          {user ? (
            <Button onClick={handleLogout} variant="secondary">Logout</Button>
          ) : (
            <Button variant="primary">Sign In/Join</Button>
          )}
        </div>
      </div>

      {/* Secondary Navigation */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="secondary" className="bg-red-500 hover:bg-red-600 text-white">
              Sell Your Car
            </Button>
            <nav className="flex items-center gap-4">
              <Link href="/" className="text-sm font-medium hover:text-white">Home</Link>
              <Link href="/classified" className="text-sm font-medium hover:text-white">Classified</Link>
              <Link href="/auction" className="text-sm font-medium hover:text-white">Auction</Link>
              <Link href="/events" className="text-sm font-medium hover:text-white">Events</Link>
              <Link href="/about" className="text-sm font-medium hover:text-white">About</Link>
              <Link href="/support" className="text-sm font-medium hover:text-white">Support</Link>
            </nav>
          </div>
          <Button variant="secondary" className="bg-pink-500 hover:bg-pink-600 text-white">
            Advance search
          </Button>
        </div>
      </div>
    </div>
  );
}