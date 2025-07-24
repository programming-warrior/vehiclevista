import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminLayout from "@/components/admin/admin-layout";
import { getUsers, blacklistUser, unBlacklistUser } from "@/api";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsers() {
  const [users, setUsers] = useState<any>([]);
  const [filteredUsers, setFilteredUsers] = useState<any>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("ACTIVE"); // Changed from showBlacklisted
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const fetchUsers = async (currentPage: number) => {
    setIsLoading(true);
    try {
      const filter = {
        search: debouncedSearch,
        status: statusFilter,
      };

      const response = await getUsers({
        page: currentPage,
        limit,
        sortBy: sortOption,
        filter: JSON.stringify(filter),
      });

      setUsers(response.users);
      setFilteredUsers(response.users);
      setTotalPages(response.totalPages);
      setTotalUsers(parseInt(response.totalUsers));
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page, limit, sortOption]);

  useEffect(() => {
    // Reset to page 1 when filters change
    fetchUsers(1);
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const handleBlacklistUser = (user: any) => {
    setSelectedUser(user);
    setBlacklistDialogOpen(true);
  };

  const confirmBlacklist = async () => {
    if (!selectedUser) return;
    try {
      await blacklistUser(selectedUser.id, blacklistReason);
      fetchUsers(page); // Refetch to get updated list
      setBlacklistDialogOpen(false);
      setBlacklistReason("");
    } catch (error) {
      console.error("Error blacklisting user:", error);
    }
  };

  const removeFromBlacklist = async (userId: any) => {
    try {
      await unBlacklistUser(userId, "");
      fetchUsers(page); // Refetch to get updated list
    } catch (error) {
      console.error("Error unblacklisting user:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusTitle = () => {
    switch (statusFilter) {
      case "ACTIVE":
        return "Active Users";
      case "BLACKLISTED":
        return "Blacklisted Users";
      default:
        return "All Users";
    }
  };

  const getStatusDescription = () => {
    switch (statusFilter) {
      case "ACTIVE":
        return "Manage existing user accounts";
      case "BLACKLISTED":
        return "Users who have been blacklisted from the platform";
      default:
        return "All user accounts";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* --- Header for Controls --- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-blue-700">
              User Management
            </h2>
            <div className="flex gap-2">
              <Input
                placeholder="Search users..."
                className="w-64 border-blue-200 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-600">Filter by status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 border-blue-200">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    <span className="flex items-center">
                      <ShieldCheck className="mr-2 h-4 w-4 text-blue-600" />
                      Active Users
                    </span>
                  </SelectItem>
                  <SelectItem value="BLACKLISTED">
                    <span className="flex items-center">
                      <ShieldAlert className="mr-2 h-4 w-4 text-red-600" />
                      Blacklisted Users
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-600">Show:</span>
                <Select
                  value={limit.toString()}
                  onValueChange={(val) => setLimit(parseInt(val))}
                >
                  <SelectTrigger className="w-20 border-blue-200">
                    <SelectValue placeholder="Entries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-600">Sort by:</span>
                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger className="w-40 border-blue-200">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="reports">Reports (High to Low)</SelectItem>
                    <SelectItem value="auctions">Auctions (High to Low)</SelectItem>
                    <SelectItem value="vehicles">Vehicles (High to Low)</SelectItem>
                    <SelectItem value="bids">Bids (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* --- Main Content Area --- */}
        {!isLoading && filteredUsers.length === 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-700">No users found</AlertTitle>
            <AlertDescription className="text-blue-600">
              There are no users matching the current filters.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-700">{getStatusTitle()}</CardTitle>
            <CardDescription className="text-blue-600">
              {getStatusDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col gap-2 p-6">
                <Skeleton className="h-16 w-full bg-blue-100" />
                <Skeleton className="h-16 w-full bg-blue-100" />
                <Skeleton className="h-16 w-full bg-blue-100" />
                <Skeleton className="h-16 w-full bg-blue-100" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white dark:bg-slate-900">
                    <tr className="border-b border-blue-200">
                      <th className="px-4 py-3 text-left font-medium text-blue-700">Username</th>
                      <th className="px-4 py-3 text-left font-medium text-blue-700">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-blue-700">Role</th>
                      <th className="px-4 py-3 text-center font-medium text-blue-700">
                        <div className="flex items-center justify-center">
                          Reports
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-blue-700">Stats</th>
                      <th className="px-4 py-3 text-left font-medium text-blue-700">Joined</th>
                      <th className="px-4 py-3 text-left font-medium text-blue-700">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-blue-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user: any) => (
                      <tr
                        key={user.id}
                        className="border-b border-blue-100 hover:bg-blue-50"
                      >
                        <td className="px-4 py-4 font-medium">{user.username}</td>
                        <td className="px-4 py-4">{user.email}</td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {parseInt(user.reports_count) > 0 ? (
                            <Badge variant="destructive">
                              {user.reports_count}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {user.auctions_count} Auctions
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {user.vehicles_count} Vehicles
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {user.bids_count} Bids
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-4">{formatDate(user.createdAt)}</td>
                        <td className="px-4 py-4">
                          <Badge
                            variant={
                              user.status === "ACTIVE" ? "outline" : "destructive"
                            }
                            className={
                              user.status === "ACTIVE"
                                ? "border-blue-500 text-blue-600"
                                : ""
                            }
                          >
                            {user.status === "BLACKLISTED" ? "Blacklisted" : "Active"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {user.status === "ACTIVE" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleBlacklistUser(user)}
                            >
                              <ShieldAlert className="mr-2 h-4 w-4" />
                              Blacklist
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                              onClick={() => removeFromBlacklist(user.id)}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Restore
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t border-blue-200 bg-blue-50 pt-4">
            <div className="text-sm text-blue-600">
              Showing{" "}
              <strong>{(page - 1) * limit + 1}</strong> -{" "}
              <strong>{Math.min(page * limit, totalUsers)}</strong> of{" "}
              <strong>{totalUsers}</strong> users
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 hover:bg-blue-100 text-blue-700"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1 || isLoading}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        className={
                          page === pageNum
                            ? "w-8 h-8 p-0 bg-blue-600 hover:bg-blue-700"
                            : "w-8 h-8 p-0 border-blue-200 text-blue-700 hover:bg-blue-100"
                        }
                        onClick={() => setPage(pageNum)}
                        disabled={isLoading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 hover:bg-blue-100 text-blue-700"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>

        <Dialog
          open={blacklistDialogOpen}
          onOpenChange={setBlacklistDialogOpen}
        >
          <DialogContent className="border-blue-300">
            <DialogHeader>
              <DialogTitle className="text-blue-700">Blacklist User</DialogTitle>
              <DialogDescription className="text-blue-600">
                Are you sure you want to blacklist {selectedUser?.username}? This will
                prevent them from accessing the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label
                  htmlFor="reason"
                  className="text-sm font-medium text-blue-700"
                >
                  Reason for blacklisting
                </label>
                <Input
                  id="reason"
                  placeholder="Enter reason for blacklisting"
                  className="border-blue-200"
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-blue-200 text-blue-700"
                onClick={() => setBlacklistDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                onClick={confirmBlacklist}
              >
                Blacklist User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}