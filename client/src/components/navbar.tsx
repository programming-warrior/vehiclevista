import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Car, ChevronDown, Search, Menu, X } from "lucide-react";
import SearchBar from "./search-bar";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="border-b relative">
      {/* Top Navigation */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Car className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-primary">Auto World Trader</span>
        </Link>

        {/* Desktop Search Bar */}
        <div className="hidden md:block flex-1 max-w-2xl mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Your Next Car, Just a Smart Search Away"
              className="w-full h-10 pl-4 pr-10 rounded-full border border-input bg-background"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            UK <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">Need Help?</Button>
          {user ? (
            <Button onClick={handleLogout} variant="secondary">Logout</Button>
          ) : (
            <Button variant="outline">Sign In/Join</Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Desktop Secondary Navigation */}
      <div className="hidden md:block bg-primary text-primary-foreground">
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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="container mx-auto px-4 py-6 space-y-6">
            {/* Mobile Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-10 pl-4 pr-10 rounded-full border border-input bg-background"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
            </div>

            {/* Mobile Navigation Links */}
            <nav className="flex flex-col space-y-4">
              <Link href="/" className="text-lg font-medium hover:text-primary">Home</Link>
              <Link href="/classified" className="text-lg font-medium hover:text-primary">Classified</Link>
              <Link href="/auction" className="text-lg font-medium hover:text-primary">Auction</Link>
              <Link href="/events" className="text-lg font-medium hover:text-primary">Events</Link>
              <Link href="/about" className="text-lg font-medium hover:text-primary">About</Link>
              <Link href="/support" className="text-lg font-medium hover:text-primary">Support</Link>
            </nav>

            {/* Mobile Action Buttons */}
            <div className="space-y-4">
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                Sell Your Car
              </Button>
              <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">
                Advance search
              </Button>
              {user ? (
                <Button onClick={handleLogout} variant="secondary" className="w-full">
                  Logout
                </Button>
              ) : (
                <Button variant="outline" className="w-full">
                  Sign In/Join
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}