import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Car, Heart } from "lucide-react";
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
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <Car className="h-6 w-6" />
          Auto World Trader
        </Link>

        <div className="hidden md:block flex-1 max-w-xl mx-8">
          <SearchBar />
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Heart className="h-5 w-5" />
          </Button>
          {user ? (
            <div className="flex items-center gap-2">
              {user.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="outline">Admin Panel</Button>
                </Link>
              )}
              <Button onClick={handleLogout} variant="secondary">
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/signin">
                <Button variant="outline">Sign Up</Button>
              </Link>
              <Link href="/login">
                <Button>Login</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="md:hidden border-t p-4">
        <SearchBar />
      </div>
    </nav>
  );
}