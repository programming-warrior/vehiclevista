import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import UserForm from "@/components/admin/user-form";
import {
  BellIcon,
  CogIcon,
  LogOutIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">User Management</h2>
          <div className="flex gap-2">
            <Input placeholder="Search users..." className="w-64" />
            <Button>Add User</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>
              New seller accounts awaiting approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    name: "John Smith",
                    email: "john@example.com",
                    type: "Seller",
                    date: "2025-04-27",
                  },
                  {
                    name: "Sarah Johnson",
                    email: "sarah@example.com",
                    type: "Trader",
                    date: "2025-04-26",
                  },
                  {
                    name: "Michael Brown",
                    email: "michael@example.com",
                    type: "Seller",
                    date: "2025-04-26",
                  },
                  {
                    name: "Emily Davis",
                    email: "emily@example.com",
                    type: "Garage",
                    date: "2025-04-25",
                  },
                ].map((user, i) => (
                  <TableRow key={i}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.type}</Badge>
                    </TableCell>
                    <TableCell>{user.date}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                        <Button size="sm" variant="default">
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive">
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage existing user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    name: "Robert Wilson",
                    email: "robert@example.com",
                    role: "Buyer",
                    status: "Active",
                  },
                  {
                    name: "Jennifer Lee",
                    email: "jennifer@example.com",
                    role: "Seller",
                    status: "Active",
                  },
                  {
                    name: "David Miller",
                    email: "david@example.com",
                    role: "Trader",
                    status: "Suspended",
                  },
                  {
                    name: "Lisa Taylor",
                    email: "lisa@example.com",
                    role: "Garage",
                    status: "Active",
                  },
                ].map((user, i) => (
                  <TableRow key={i}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "Active" ? "outline" : "destructive"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit Role</DropdownMenuItem>
                          <DropdownMenuItem>Reset Password</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Suspend Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm">
              Previous
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                1
              </Button>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                2
              </Button>
              <Button variant="outline" size="sm" className="w-8 h-8 p-0">
                3
              </Button>
            </div>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
}
