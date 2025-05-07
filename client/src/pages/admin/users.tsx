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
        users.filter((user: any) =>
          user.id !== selectedUser?.id
        )
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
      setFilteredUsers(
        users.filter((user: any) =>
          user.id !== userId
        )
      );
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
          <h2 className="text-2xl font-semibold">User Management</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Search users..."
              className="w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-between items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Button
              variant={!showBlacklisted ? "default" : "outline"}
              onClick={() => setShowBlacklisted(false)}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Active Users
            </Button>
            <Button
              variant={showBlacklisted ? "default" : "outline"}
              onClick={() => setShowBlacklisted(true)}
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Blacklisted Users
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-40">
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
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No blacklisted users</AlertTitle>
            <AlertDescription>
              There are currently no blacklisted users in the system.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {showBlacklisted ? "Blacklisted Users" : "All Users"}
            </CardTitle>
            <CardDescription>
              {showBlacklisted
                ? "Users who have been blacklisted from the platform"
                : "Manage existing user accounts"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">
                      Username
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-center py-3 px-4 font-medium">
                      <div className="flex items-center justify-center">
                        Reports
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 font-medium">Stats</th>
                    <th className="text-left py-3 px-4 font-medium">Joined</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-right py-3 px-4 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user: any) => (
                    <tr key={user.id} className="border-b">
                      <td className="py-4 px-4 font-medium">{user.username}</td>
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
                            user.status === "active" ? "outline" : "destructive"
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
                                    className="text-red-600"
                                    onClick={() => handleBlacklistUser(user)}
                                  >
                                    <UserX className="mr-2 h-4 w-4" />
                                    Blacklist User
                                  </Button>
                                ) : (
                                  <Button
                                    className="text-green-600"
                                    onClick={() => removeFromBlacklist(user.id)}
                                  >
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Remove from Blacklist
                                  </Button>
                                )}
                
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {totalUsers} users
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1 || isLoading}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    // Show pages around current page
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
                        className="w-8 h-8 p-0"
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Blacklist User</DialogTitle>
              <DialogDescription>
                Are you sure you want to blacklist {selectedUser?.username}?
                This will prevent them from accessing the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="reason" className="text-sm font-medium">
                  Reason for blacklisting
                </label>
                <Input
                  id="reason"
                  placeholder="Enter reason for blacklisting"
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBlacklistDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmBlacklist}>
                Blacklist User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
