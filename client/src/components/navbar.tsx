import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Car,
  ChevronDown,
  Search,
  Menu,
  X,
  Settings,
  User,
  LogOut,
  HelpCircle,
  BellRing,
  Bell,
  Info,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  TicketCheckIcon,
  CheckCheck,
  Package,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  useUser,
  useHeroSectionSearch,
  useNotification,
  useSystemConfigStore
} from "@/hooks/use-store";
import { logoutUser, advanceVehicleSearch, getNotifications } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useGlobalLoading } from "@/hooks/use-store";
export default function Navbar() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const { userId, role, setUser } = useUser();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const { setSearch } = useHeroSectionSearch();
  const { toast } = useToast();
  const {
    notifications,
    unReadCount,
    addNotification,
    setNotifications,
    setUnReadCount,
    setTotalNotifications,
  } = useNotification();
  const [filteredNotification, setFilteredNotification] = useState<any>([]);
  const { globalLoading, setGlobalLoading } = useGlobalLoading();
  const { systemConfig } = useSystemConfigStore();

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser({
        userId: "",
        role: "",
        card_Verified: false,
      });
      localStorage.removeItem("sessionId");
      toast({
        variant: "default",
        title: "Logout Successful",
        description: "You have been logged out successfully.",
      });
      setLocation("/");
    } catch (e) {
      console.log("logout failed");
    } finally {
      setUserMenuOpen(false);
    }
  };

  const isAdmin = role === "admin";

  async function fetchNotifications() {
    try {
      let page = 1;
      let limit = 5;
      let filter = {
        is_read: false,
      };
      let queryString = `?page=${page}&limit=${limit}`;
      if (filter) {
        queryString += `&filter=${JSON.stringify(filter)}`;
      }
      const {
        notifications: responseNotification,
        totalNotifications,
        unreadNotificationsCount,
      } = await getNotifications(queryString);
      if (responseNotification.length > 0) {
        for (const notification of responseNotification) {
          if (
            notifications.length == 0 ||
            notifications.findIndex((n) => n.id === notification.id) === -1
          ) {
            console.log("Adding notification navbar:", notification.id);
            addNotification(notification);
          }
        }
        setNotifications(responseNotification);
        setUnReadCount(unreadNotificationsCount);
        setTotalNotifications(totalNotifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }

  useEffect(() => {
    console.log(notifications);
    setFilteredNotification(
      notifications
        .filter(n => !n.isRead)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  }, [notifications])

  console.log(filteredNotification);

  // Close menus when clicking outside
  useEffect(() => {
    if (userId && notifications.length === 0) {
      fetchNotifications();
    }
    const handleClickOutside = (event: any) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target)
      ) {
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userId]);

  async function handleSearchSubmit(events: any) {
    events.preventDefault();
    const searchParam = searchRef.current?.value;
    if (searchParam) {
      try {
        setGlobalLoading(true);
        const res = await advanceVehicleSearch(searchParam);
        const filteredSchema = res.filterSchema;
        setSearch({
          make: filteredSchema.brand ?? "",
          model: filteredSchema.model ?? "",
          variant: filteredSchema.variant ?? "",
          vehicleType: filteredSchema.type ?? "",
          transmissionType: filteredSchema.transmissionType ?? "",
          fuelType: filteredSchema.fuelType ?? "",
          color: filteredSchema.color ?? "",
          minBudget: filteredSchema.minBudget ?? 0,
          maxBudget: filteredSchema.maxBudget ?? 0,
        });
        setLocation("/classified");
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Search Failed",
          description: e.message,
        });
        console.log("search failed");
      }
      finally {
        setGlobalLoading(false);
      }
    }
  }

  function getTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }

  return (
    <div className="border-b border-gray-200 bg-white shadow-sm border-none sticky top-0 z-50">
      {/* Top Navigation */}
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
          <Car className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <span className="text-base sm:text-xl font-bold text-gray-900 truncate max-w-[150px] sm:max-w-none">
            Auto World Trader
          </span>
        </Link>

        {/* Desktop Search Bar */}
        <div className="hidden lg:block flex-1 max-w-2xl mx-4 lg:mx-8">
          <div className="relative">
            <form onSubmit={handleSearchSubmit}>
              <input
                ref={searchRef}
                type="text"
                name="search"
                placeholder="Your Next Car, Just a Smart Search Away"
                className="w-full h-9 sm:h-10 pl-3 sm:pl-4 pr-10 text-sm sm:text-base rounded-lg border border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all"
              />
              <button type="submit" className="hidden">
                Search
              </button>
            </form>
            <Search className="absolute right-3 top-2 sm:top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-4">
          {isAdmin && (
            <Button
              variant="ghost"
              asChild
              className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              <Link href="/admin" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Admin Panel
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            className="flex items-center gap-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 text-sm"
            size="sm"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden xl:inline">Need Help</span>
          </Button>

          <div className="relative" ref={notificationMenuRef}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full relative text-gray-700 hover:text-blue-600 hover:bg-blue-50 h-9 w-9"
              onClick={() =>
                setNotificationMenuOpen(
                  (notificationMenuOpen) => !notificationMenuOpen
                )
              }
            >
              <BellRing className="h-5 w-5" />
              {unReadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-0 -right-0 h-3 w-3 flex items-center justify-center p-[1px] text-xs bg-red-500 hover:bg-red-500"
                >
                </Badge>
              )}
            </Button>
            {notificationMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-x-hidden overflow-y-auto">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      Notifications
                    </h3>

                  </div>
                </div>
                {notifications.length > 0 ? (
                  <div className="py-1">
                    {filteredNotification.map((notification: any, index: number) => {
                      const messageData =
                        typeof notification.message === "string"
                          ? JSON.parse(notification.message)
                          : notification.message;
                      console.log("messageData", messageData);
                      return (
                        <div
                          key={notification.id}
                          onClick={() => {
                            setNotificationMenuOpen(false);
                            setLocation("/notifications")
                          }}
                        >
                          <div className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex   gap-3">
                              <Info className="h-4 w-4 text-blue-500 mt-1" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 font-medium">
                                  {messageData.title}
                                </p>
                                <p className="text-sm text-gray-500 ">
                                  {messageData.body}
                                </p>
                                <p className="flex items-center justify-between text-xs text-gray-500 ">
                                  <span>
                                    {getTimeAgo(notification.createdAt)}
                                  </span>
                                  <span>
                                    {notification.isRead ? (
                                      <CheckCheck className="w-5 h-5 text-blue-400" />
                                    ) : (
                                      <CheckCheck className="w-5 h-5 text-gray-400" />
                                    )}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                          {index < notifications.length - 1 && (
                            <Separator className="mx-4" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notifications</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {userId && role ? (
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-gray-700 hover:text-blue-600 hover:bg-blue-50 h-9 w-9"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <User className="h-5 w-5" />
              </Button>

              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                  <Link
                    href="/profile"
                    className="flex font-medium items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <Separator className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex font-medium items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              asChild
              className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white text-sm h-9"
            >
              <Link href="/login">
                <span className="hidden xl:inline">Sign In/Join</span>
                <span className="xl:hidden">Sign In</span>
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-gray-700 hover:text-blue-600 hover:bg-blue-50 h-9 w-9"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </Button>
      </div>

      {/* Desktop Secondary Navigation */}
      <div className="hidden lg:block bg-blue-600 text-white py-2">
        <div className="container mx-auto px-4 h-10 sm:h-12 flex items-center justify-between">
          <div className="flex items-center gap-2 xl:gap-4">
            <Button
              variant="secondary"
              className="bg-red-500 hover:bg-red-600 text-white border-0 h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
              onClick={() => setLocation("/seller/vehicle/upload")}
            >
              Sell Your Car
            </Button>
            <Button
              variant="secondary"
              className="bg-yellow-500 hover:bg-yellow-600 text-white border-0 h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
              onClick={() => setLocation("/seller/auction/create")}
            >
              Create Auction
            </Button>
            <nav className="flex items-center gap-3 xl:gap-6">
              <Link
                href="/"
                className="text-sm font-medium hover:text-blue-200 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/classified"
                className="text-sm font-medium hover:text-blue-200 transition-colors"
              >
                Classified
              </Link>
              {
                systemConfig && systemConfig.isAuctionVisible &&
                <Link
                  href="/auction"
                  className="text-sm font-medium hover:text-blue-200 transition-colors"
                >
                  Auction
                </Link>
              }
              <Link
                href="/about"
                className="text-sm font-medium hover:text-blue-200 transition-colors"
              >
                About
              </Link>
              <Link
                href="/support"
                className="text-sm font-medium hover:text-blue-200 transition-colors"
              >
                Support
              </Link>
            </nav>
          </div>
          <Button
            variant="secondary"
            className="bg-pink-500 hover:bg-pink-600 text-white border-0 h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
            onClick={() => searchRef.current?.focus()}
          >
            <span className="hidden xl:inline">Advanced Search</span>
            <span className="xl:hidden">Search</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white lg:hidden overflow-y-auto">
          <div className="container mx-auto px-4 py-4">
            {/* Mobile Header with Close Button */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <Car className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-bold text-gray-900">
                  Auto World Trader
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-700 hover:text-red-600 hover:bg-red-50 h-9 w-9"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Mobile Search */}
            <div className="relative mb-6">
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  placeholder="Search for your next car..."
                  className="w-full h-10 pl-4 pr-10 text-sm rounded-lg border border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                />
                <button type="submit" className="hidden">
                  Search
                </button>
              </form>
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            {/* Mobile Navigation Links */}
            <nav className="flex flex-col space-y-3 mb-6">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-blue-50 p-3 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  Admin Panel
                </Link>
              )}
              <Link
                href="/"
                className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-blue-50 p-3 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Car className="h-5 w-5" />
                Home
              </Link>
              <Link
                href="/classified"
                className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-blue-50 p-3 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Package className="h-5 w-5" />
                Classified
              </Link>
              {systemConfig && systemConfig.isAuctionVisible && (
                <Link
                  href="/auction"
                  className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-blue-50 p-3 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <TicketCheckIcon className="h-5 w-5" />
                  Auction
                </Link>
              )}
              <Link
                href="/about"
                className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-blue-50 p-3 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Info className="h-5 w-5" />
                About
              </Link>
              <Link
                href="/support"
                className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-blue-50 p-3 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <HelpCircle className="h-5 w-5" />
                Support
              </Link>
            </nav>

            {/* Mobile User Options */}
            {userId && role ? (
              <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-blue-50 p-3 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>
                <Link
                  href="/notifications"
                  className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-blue-50 p-3 rounded-lg transition-colors relative"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Bell className="h-5 w-5" />
                  Notifications
                  {unReadCount > 0 && (
                    <Badge className="bg-red-500 hover:bg-red-500 text-white ml-auto">
                      {unReadCount}
                    </Badge>
                  )}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 text-base font-medium text-gray-900 hover:text-red-600 hover:bg-red-50 p-3 rounded-lg transition-colors w-full text-left"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            ) : null}

            {/* Mobile Action Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full bg-red-500 hover:bg-red-600 text-white h-11 text-base font-medium shadow-sm"
                onClick={() => {
                  setLocation("/seller/vehicle/upload");
                  setMobileMenuOpen(false);
                }}
              >
                Sell Your Car
              </Button>
              <Button
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white h-11 text-base font-medium shadow-sm"
                onClick={() => {
                  setLocation("/seller/auction/create");
                  setMobileMenuOpen(false);
                }}
              >
                Create Auction
              </Button>
              <Button
                className="w-full bg-pink-500 hover:bg-pink-600 text-white h-11 text-base font-medium shadow-sm"
                onClick={() => {
                  searchRef.current?.focus();
                  setMobileMenuOpen(false);
                }}
              >
                Advanced Search
              </Button>
              {!userId && (
                <Button
                  variant="outline"
                  className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white h-11 text-base font-medium"
                  asChild
                >
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In / Join
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
