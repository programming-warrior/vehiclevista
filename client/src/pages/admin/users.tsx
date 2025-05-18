import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function AdminUsers() {
  const [users, setUsers] = useState<any>([]);
  const [filteredUsers, setFilteredUsers] = useState<any>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [showBlacklisted, setShowBlacklisted] = useState(false);
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const filter = {
        search: searchQuery,
        status: showBlacklisted ? "blacklisted" : "active",
      };

      const response = await getUsers({
        page,
        limit,
        sortBy: sortOption,
        filter: JSON.stringify(filter),
      });

      setUsers(response.users);
      setFilteredUsers(response.users);
      setTotalPages(response.totalPages);
      setTotalUsers(response.totalUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, [page, limit, sortOption, searchQuery, showBlacklisted]);

  const handleBlacklistUser = (user: any) => {
    setSelectedUser(user);
    setBlacklistDialogOpen(true);
  };

  const confirmBlacklist = async () => {
    try {
      await blacklistUser(selectedUser.id, blacklistReason);
      setUsers(
        users.map((user: any) =>
          user.id === selectedUser?.idi
            ? { ...user, status: "blacklisted", blacklistReason }
            : user
        )
      );
      setFilteredUsers(
        users.filter((user: any) => user.id !== selectedUser?.id)
      );
      setBlacklistDialogOpen(false);
      setBlacklistReason("");
    } catch (error) {
      console.error("Error blacklisting user:", error);
    }
  };

  const removeFromBlacklist = async (userId: any) => {
    try {
      await unBlacklistUser(userId, "");
      setUsers(
        users.map((user: any) =>
          user.id === userId
            ? { ...user, status: "active", blacklistReason: "" }
            : user
        )
      );
      setFilteredUsers(users.filter((user: any) => user.id !== userId));
      setBlacklistDialogOpen(false);
      setBlacklistReason("");
    } catch (error) {
      console.error("Error blacklisting user:", error);
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

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
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

        <div className="flex justify-between items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Button
              variant={!showBlacklisted ? "default" : "outline"}
              className={
                !showBlacklisted ? "bg-blue-600 hover:bg-blue-700" : ""
              }
              onClick={() => setShowBlacklisted(false)}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Active Users
            </Button>
            <Button
              variant={showBlacklisted ? "default" : "outline"}
              className={
                showBlacklisted ? "bg-blue-600 hover:bg-blue-700" : ""
              }
              onClick={() => setShowBlacklisted(true)}
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Blacklisted Users
            </Button>
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

        {showBlacklisted && filteredUsers.length === 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-700">
              No blacklisted users
            </AlertTitle>
            <AlertDescription className="text-blue-600">
              There are currently no blacklisted users in the system.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-700">
              {showBlacklisted ? "Blacklisted Users" : "All Users"}
            </CardTitle>
            <CardDescription className="text-blue-600">
              {showBlacklisted
                ? "Users who have been blacklisted from the platform"
                : "Manage existing user accounts"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-2 flex flex-col gap-4 border-blue-200">
                <Skeleton className="w-full h-16 bg-blue-100" />
                <Skeleton className="w-full h-16 bg-blue-100" />
                <Skeleton className="w-full h-16 bg-blue-100" />
                <Skeleton className="w-full h-16 bg-blue-100" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-blue-100">
                      <th className="text-left py-3 px-4 font-medium text-blue-700">
                        Username
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-700">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-700">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-700">
                        <div className="flex items-center justify-center">
                          Reports
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-700">
                        Stats
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-700">
                        Joined
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user: any) => (
                      <tr
                        key={user.id}
                        className="border-b border-blue-100 hover:bg-blue-50"
                      >
                        <td className="py-4 px-4 font-medium">
                          {user.username}
                        </td>
                        <td className="py-4 px-4">{user.email}</td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {parseInt(user.reports_count) > 0 ? (
                            <Badge variant="destructive">
                              {user.reports_count}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
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
                        <td className="py-4 px-4">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant={
                              user.status === "active"
                                ? "outline"
                                : "destructive"
                            }
                            className={
                              user.status === "active"
                                ? "border-blue-500 text-blue-600"
                                : ""
                            }
                          >
                            {user.status === "blacklisted"
                              ? "Blacklisted"
                              : "Active"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {user.status === "active" ? (
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
          <CardFooter className="pt-2 flex justify-between bg-blue-50">
            <div className="text-sm text-blue-600">
              Showing {filteredUsers.length} of {totalUsers} users
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
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
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
              <DialogTitle className="text-blue-700">
                Blacklist User
              </DialogTitle>
              <DialogDescription className="text-blue-600">
                Are you sure you want to blacklist {selectedUser?.username}?
                This will prevent them from accessing the platform.
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
