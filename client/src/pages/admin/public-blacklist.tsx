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

export default function AdminPublicBlacklist() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Fraud & Blacklist Management
          </h2>
          <Button>Add to Blacklist</Button>
        </div>

        <Alert>
          <AlertTitle>Latest Activity</AlertTitle>
          <AlertDescription>
            3 users were flagged for suspicious activity in the last 24 hours.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Blacklisted Users</CardTitle>
            <CardDescription>Users banned for violations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    name: "James Wilson",
                    email: "james@example.com",
                    reason: "Fraudulent Listings",
                    date: "2025-03-15",
                  },
                  {
                    name: "Amanda Parker",
                    email: "amanda@example.com",
                    reason: "Payment Scam",
                    date: "2025-02-22",
                  },
                  {
                    name: "Kevin Johnson",
                    email: "kevin@example.com",
                    reason: "Multiple Account Abuse",
                    date: "2025-04-10",
                  },
                ].map((user, i) => (
                  <TableRow key={i}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.reason}</TableCell>
                    <TableCell>{user.date}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm" variant="destructive">
                          Remove Ban
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
