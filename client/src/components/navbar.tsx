import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Car, Heart, BarChart2, Upload, Package } from "lucide-react";
import SearchBar from "./search-bar";
import { useAuth } from "@/hooks/use-auth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const isTraderOrGarage = user?.role === "trader" || user?.role === "garage";

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

        <div className="hidden md:flex items-center gap-4">
          <Link href="/classified">
            <Button variant="ghost">Classified Cars</Button>
          </Link>
          {isTraderOrGarage && (
            <>
              <Link href="/trader/dashboard">
                <Button variant="ghost" className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" />
                  Performance
                </Button>
              </Link>
              <Link href="/trader/bulk-upload">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Bulk Upload
                </Button>
              </Link>
              <Link href="/trader/packages">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Packages
                </Button>
              </Link>
            </>
          )}
          <div className="w-[300px]">
            <SearchBar />
          </div>
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
        <div className="flex flex-col gap-4">
          <Link href="/classified">
            <Button variant="ghost" className="w-full">Classified Cars</Button>
          </Link>
          {isTraderOrGarage && (
            <>
              <Link href="/trader/dashboard">
                <Button variant="ghost" className="w-full flex items-center gap-2 justify-center">
                  <BarChart2 className="h-4 w-4" />
                  Performance
                </Button>
              </Link>
              <Link href="/trader/bulk-upload">
                <Button variant="ghost" className="w-full flex items-center gap-2 justify-center">
                  <Upload className="h-4 w-4" />
                  Bulk Upload
                </Button>
              </Link>
              <Link href="/trader/packages">
                <Button variant="ghost" className="w-full flex items-center gap-2 justify-center">
                  <Package className="h-4 w-4" />
                  Packages
                </Button>
              </Link>
            </>
          )}
          <SearchBar />
        </div>
      </div>
    </nav>
  );
}