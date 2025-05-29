import React, { useState, useEffect } from "react";
import {
  Bell,
  BellRing,
  ChevronDown,
  ChevronUp,
  Filter,
  SortDesc,
  SortAsc,
  Mail,
  MailOpen,
  User,
  Car,
  Gavel,
  Trophy,
  MessageSquare,
  Clock,
  CheckCheck,
  Circle,
} from "lucide-react";
import { getNotifications, markNotificationRead } from "@/api";
import { useNotification } from "@/hooks/use-store";
import { toast } from "@/hooks/use-toast";
import { not } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const NotificationsPage = () => {
  const {
    notifications,
    setNotifications,
    totalNotifications,
    unReadCount,
    setTotalNotifications,
    addNotification,
    setUnReadCount,
    updateNotification
  } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [expandedNotification, setExpandedNotification] = useState<
    number | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const [filters, setFilters] = useState<{
    type: string;
    is_read: boolean | null;
  }>({
    type: "",
    is_read: null,
  });
  const [sortOrder, setSortOrder] = useState<"oldest" | "newest">("newest");
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 5;
  const [totalPages, setTotalPages] = useState(0);
  const startIndex = (currentPage - 1) * itemsPerPage;
    
  const notificationTypes = [
    { value: "ALL", label: "All Types", icon: Bell },
    { value: "CONTACT_SELLER", label: "Contact Seller", icon: MessageSquare },
    { value: "BID", label: "Bids", icon: Gavel },
    { value: "AUCTION", label: "Auctions", icon: Car },
    { value: "RAFFLE", label: "Raffles", icon: Trophy },
  ];

  const fetchNotifications = async (page: number) => {
    try {
      setIsLoading(true);
      let queryString = `page=${page}&limit=${limit}&`;
      if (filters) queryString += `filter=${JSON.stringify(filters)}&`;
      if (sortOrder) queryString += `sortBy=${sortOrder}`;

      const data = await getNotifications(queryString);
      if (!data || !data.notifications) {
        throw new Error("No notifications found");
      }
      
      setNotifications(data.notifications);
      setTotalPages(data.totalPages);
      setTotalNotifications(data.totalNotifications);
      setUnReadCount(data.unreadNotificationsCount);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error fetching notifications",
        description:
          "There was an error fetching your notifications. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    fetchNotifications(currentPage);
  }, [currentPage, sortOrder]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "CONTACT_SELLER":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "BID":
        return <Gavel className="h-5 w-5 text-green-500" />;
      case "AUCTION":
        return <Car className="h-5 w-5 text-purple-500" />;
      case "RAFFLE":
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationBadgeVariant = (type: string) => {
    switch (type) {
      case "CONTACT_SELLER":
        return "default";
      case "BID":
        return "secondary";
      case "AUCTION":
        return "destructive";
      case "RAFFLE":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getTimeAgo = (dateString: string) => {
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
  };

  const handleNotificationClick = async(notificationId: number) => {
    setExpandedNotification(
      expandedNotification === notificationId ? null : notificationId
    );
    markNotificationRead(notificationId);
    updateNotification(notificationId, { is_read: true });
    setUnReadCount((prev) => prev - 1);
  };

  const markAllAsRead = () => {
    notifications.forEach((notification) => {
      if (!notification.is_read) {
        updateNotification(notification.id, { is_read: true });
      }
    });
    setUnReadCount(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <BellRing className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Notifications
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    {unReadCount > 0 ? (
                      <span className="flex items-center gap-2">
                        <Badge variant="destructive" className="px-2 py-1">
                          {unReadCount}
                        </Badge>
                        unread notifications
                      </span>
                    ) : (
                      "All notifications read"
                    )}
                  </p>
                </div>
              </div>
              {unReadCount > 0 && (
                <Button onClick={markAllAsRead} className="shadow-md">
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark All as Read
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {showFilters ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-4">
                  <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Notification Type
                          </label>
                          <Select
                            value={filters.type}
                            onValueChange={(value) =>
                              setFilters((prev) => ({ ...prev, type: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {notificationTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <type.icon className="h-4 w-4" />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Read Status
                          </label>
                          <Select
                            value={filters.is_read === null ? "ALL" : filters.is_read ? "READ" : "UNREAD"}
                            onValueChange={(value) =>
                              setFilters((prev) => ({
                                ...prev,
                                is_read: value === 'READ' ? true : value === 'UNREAD' ? false : null,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL">All Notifications</SelectItem>
                              <SelectItem value="UNREAD">Unread Only</SelectItem>
                              <SelectItem value="READ">Read Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>

              <Button
                variant="outline"
                onClick={() =>
                  setSortOrder(sortOrder === "oldest" ? "newest" : "oldest")
                }
                className="gap-2"
              >
                {sortOrder === "newest" ? (
                  <>
                    <SortDesc className="h-4 w-4" />
                    Newest First
                  </>
                ) : (
                  <>
                    <SortAsc className="h-4 w-4" />
                    Oldest First
                  </>
                )}
              </Button>

              <Badge variant="outline" className="ml-auto">
                Showing {startIndex + 1}-
                {Math.min(startIndex + itemsPerPage, notifications.length)} of{" "}
                {notifications.length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification, index) => {
                const messageData =
                  typeof notification.message === "string"
                    ? JSON.parse(notification.message)
                    : notification.message;

                const isExpanded = expandedNotification === notification.id;

                return (
                  <div
                    key={notification.id}
                    className={`transition-all duration-300 ease-in-out ${
                      isExpanded 
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 shadow-inner border-l-4 border-blue-400" 
                        : !notification.is_read 
                          ? "bg-blue-50/50 hover:bg-blue-50" 
                          : "hover:bg-gray-50"
                    }`}
                  >
                    <div
                      onClick={() => handleNotificationClick(notification.id)}
                      className="p-6 cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 pt-1">
                          <div className={`p-2 rounded-full transition-all duration-200 ${
                            isExpanded 
                              ? "bg-blue-200 scale-110" 
                              : "bg-gray-100"
                          }`}>
                            {/* {getNotificationIcon(notification.type)} */}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className={`font-semibold transition-colors ${
                                  isExpanded ? "text-blue-900" : "text-gray-900"
                                }`}>
                                  {messageData.title}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    // variant={getNotificationBadgeVariant(notification.type)}
                                    className="text-xs"
                                  >
                                    {/* {notification.type.replace("_", " ")} */}
                                  </Badge>
                                  {!notification.is_read && (
                                    <Circle className="h-2 w-2 fill-blue-600 text-blue-600 animate-pulse" />
                                  )}
                                </div>
                              </div>

                              <p className={`text-sm leading-relaxed ${
                                isExpanded ? "text-blue-800" : "text-gray-700"
                              }`}>
                                {messageData.body}
                              </p>

                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  From: {messageData.from?.name || "System"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {getTimeAgo(notification.createdAt)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              {notification.isRead ? (
                                <CheckCheck className="h-4 w-4 text-blue-500" />
                              ) : (
                                <CheckCheck className="h-4 w-4 text-gray-300" />
                              )}
                              <div className={`transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}>
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details with smooth animation */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}>
                      <div className="px-6 pb-6">
                        <Separator className="mb-4" />
                        <Card className="bg-white/60 backdrop-blur-sm border border-blue-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                              <Bell className="h-4 w-4" />
                              Notification Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-700">Type:</span>
                                <Badge variant="outline">
                                  {/* {notification.type.replace("_", " ")} */}
                                </Badge>
                              </div>

                              <div className="flex justify-between">
                                <span className="font-medium text-gray-700">ID:</span>
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  #{notification.notificationId}
                                </code>
                              </div>

                              {messageData.from && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="font-medium text-gray-700">From:</span>
                                    <span className="text-gray-600">{messageData.from.name}</span>
                                  </div>

                                  <div className="flex justify-between">
                                    <span className="font-medium text-gray-700">Email:</span>
                                    <span className="text-gray-600 text-xs">{messageData.from.email}</span>
                                  </div>
                                </>
                              )}

                              <div className="md:col-span-2 flex justify-between">
                                <span className="font-medium text-gray-700">Created:</span>
                                <span className="text-gray-600 text-xs">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <span className="font-medium text-gray-700 text-sm block mb-2">
                                Full Message:
                              </span>
                              <Card className="bg-white border border-gray-200">
                                <CardContent className="p-3">
                                  <p className="text-sm text-gray-800 leading-relaxed">
                                    {messageData.body}
                                  </p>
                                </CardContent>
                              </Card>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No notifications found
              </h3>
              <p className="text-gray-600">
                {filters.type !== "ALL" || filters.is_read !== null
                  ? "Try adjusting your filters to see more notifications."
                  : "You have no notifications at this time."}
              </p>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="mt-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  Page {currentPage} of {totalPages}
                </Badge>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;