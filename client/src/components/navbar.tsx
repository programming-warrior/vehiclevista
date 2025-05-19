import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Car, ChevronDown, Search, Menu, X, Settings, User, LogOut } from "lucide-react";
import SearchBar from "./search-bar";
import { useState, useEffect, useRef } from "react";
import { useUser, useHeroSectionSearch} from "@/hooks/use-store";
import { logoutUser, advanceVehicleSearch } from "@/api";
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { userId, role, setUser } = useUser();
  const userMenuRef = useRef<HTMLDivElement|null>(null);
  const searchRef = useRef<HTMLInputElement|null>(null);
  const {setSearch} = useHeroSectionSearch();
  const {toast} = useToast();

  const handleLogout = async () => {
    try{
      await logoutUser()
      setUser({
        userId:"",
        role:"", 
        card_Verified: false,
      })
      localStorage.deleteItem('sessionId')
      toast({
        variant: 'default',
        title: 'Logout Successful',
        description: 'You have been logged out successfully.',
      });
      setLocation('/')
    }
    catch(e){
      console.log('logout failed');
    }
    finally{
      setUserMenuOpen(false);
    }
  };

  const isAdmin = role === "admin";

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event:any) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function handleSearchSubmit(events:any) {
    events.preventDefault();
    const searchParam= searchRef.current?.value;
    if(searchParam){
      try{
        const res = await advanceVehicleSearch(searchParam);
        const filteredSchema = res.filterSchema;
        setSearch({
          brand: filteredSchema.brand ?? "",
          model: filteredSchema.model ?? "",
          vehicleType: filteredSchema.type ?? "",
          color: filteredSchema.color ?? "",
          transmissionType: filteredSchema.transmissionType ?? "",
          minBudget: filteredSchema.minBudget ?? 0,
          maxBudget: filteredSchema.maxBudget ?? 0
        }) 
        setLocation('/vehicle');
      }
      catch(e:any){
        toast({
          variant: 'destructive',
          title: 'Search Failed',
          description: e.message
        })
        console.log('search failed');
      }
    }
  }

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
            <form onSubmit={handleSearchSubmit}>
              <input
                ref={searchRef}
                type="text"
                name="search"
                placeholder="Your Next Car, Just a Smart Search Away"
                className="w-full h-10 pl-4 pr-10 rounded-full border border-input bg-background"
              />
              <button type="submit" className="hidden">
                Search
              </button>
            </form>
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {isAdmin && (
            <Button variant="ghost" asChild>
              <Link href="/admin" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Admin Panel
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm">Need Help?</Button>
          
          {userId && role ? (
            <div className="relative" ref={userMenuRef}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <User className="h-5 w-5" />
              </Button>
              
              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    {/* <p 

                    className="uppercase font-semibold block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {role}
                  </p> */}
                  <Link 
                    href="/profile" 
                    className="flex font-semibold items-center gap-1  px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                   <User className="text-xs"/> Profile
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="flex font-semibold items-center gap-1 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut/> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/login">Sign In/Join</Link>
            </Button>
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
            <Button variant="secondary" className="bg-red-500 hover:bg-red-600 text-white" 
              onClick={() => setLocation('/seller/vehicle/upload')}
            >
              Sell Your Car
            </Button>
            <nav className="flex items-center gap-4">
              <Link href="/" className="text-sm font-medium hover:text-white">Home</Link>
              <Link href="/vehicle" className="text-sm font-medium hover:text-white">Classified</Link>
              <Link href="/auction" className="text-sm font-medium hover:text-white">Auction</Link>
              {/* <Link href="/events" className="text-sm font-medium hover:text-white">Events</Link> */}
              <Link href="/about" className="text-sm font-medium hover:text-white">About</Link>
              <Link href="/support" className="text-sm font-medium hover:text-white">Support</Link>
            </nav>
          </div>
          <Button variant="secondary" 
            className="bg-pink-500 hover:bg-pink-600 text-white"
            onClick={()=>searchRef.current?.focus()}
          >
            Advance search
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="container mx-auto px-4 py-6">
            {/* Mobile Search */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-10 pl-4 pr-10 rounded-full border border-input bg-background"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
            </div>

            {/* Mobile Navigation Links */}
            <nav className="flex flex-col space-y-4 mb-6">
              {isAdmin && (
                <Link href="/admin" className="text-lg font-medium hover:text-primary">Admin Panel</Link>
              )}
              <Link href="/" className="text-lg font-medium hover:text-primary">Home</Link>
              <Link href="/classified" className="text-lg font-medium hover:text-primary">Classified</Link>
              <Link href="/auction" className="text-lg font-medium hover:text-primary">Auction</Link>
              <Link href="/events" className="text-lg font-medium hover:text-primary">Events</Link>
              <Link href="/about" className="text-lg font-medium hover:text-primary">About</Link>
              <Link href="/support" className="text-lg font-medium hover:text-primary">Support</Link>
            </nav>

            {/* Mobile User Options */}
            {userId && role ? (
              <div className="space-y-4 mb-6">
                <Link href="/profile" className="text-lg font-medium hover:text-primary block">
                  Profile
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="text-lg font-medium hover:text-primary block w-full text-left"
                >
                  Logout
                </button>
              </div>
            ) : null}

            {/* Mobile Action Buttons */}
            <div className="space-y-4">
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                Sell Your Car
              </Button>
              <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">
                Advance search
              </Button>
              {!userId && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/login">Sign In/Join</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}