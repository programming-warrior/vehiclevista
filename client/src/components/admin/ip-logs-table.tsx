"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, MapPin } from "lucide-react";
import { adminGetLoginLogs } from "@/api";
import { useDebounce } from "@/hooks/use-debounce";

interface AdminLoginLog {
  id: number;
  adminId: number;
  ipAddress: string;
  locationCity: string;
  locationCountry: string;
  deviceBrowser: string;
  deviceOs: string;
  userAgentRaw: string;
  sessionDuration: number;
  status: string;
  createdAt: string;
}

export default function IPLogsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loginLogs, setLoginLogs] = useState<AdminLoginLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limit, setLimit] = useState(10);
  const debouncedSearchTerm = useDebounce(searchTerm);

  async function fetchLogs(page:number) {
    try {
      const filter = JSON.stringify({
        status: statusFilter,
        search: searchTerm,
      });
      const res = await adminGetLoginLogs(
        `?page=${page}&limit=${limit}&filter=${filter}`
      );
      setLoginLogs(res.logs);
      setTotalPages(res.totalPages);
      setTotalLogs(Number(res.totalLogs));
    } catch (e) {
      console.error(e);
    }
  }
  useEffect(() => {
    fetchLogs(page);
  }, [page, limit]);

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [statusFilter, debouncedSearchTerm]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-blue-600">
                Admin Login Logs
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor all admin login activities with detailed IP and device
                information
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex items-center justify-between mb-6 space-x-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Filter by status:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Show:</span>
                <Select
                  value={limit.toString()}
                  onValueChange={(val) => setLimit(parseInt(val))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="5">5</SelectItem>

                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by IP, location, browser..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">IP Address</TableHead>
                  <TableHead className="font-semibold">Location</TableHead>
                  <TableHead className="font-semibold">Device</TableHead>
                  <TableHead className="font-semibold">Login Time</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Session</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginLogs?.map((log: AdminLoginLog) => (
                  <TableRow key={log.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-mono text-sm">{log.ipAddress}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">
                          {log.locationCity}, {log.locationCountry}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className="text-sm text-gray-600 max-w-48 truncate"
                        title={`${log.deviceBrowser} | ${log.deviceOs}`}
                      >
                        {log.deviceBrowser}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === "success" ? "default" : "destructive"
                        }
                        className={
                          log.status === "success"
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{log.sessionDuration}s</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-blue-200 bg-blue-50 pt-4">
          <div className="text-sm text-blue-600">
            Showing <strong>{(page - 1) * limit + 1}</strong> -{" "}
            <strong>{Math.min(page * limit, totalLogs)}</strong> of{" "}
            <strong>{totalLogs}</strong> vehicles
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-700 hover:bg-blue-100"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {/* Pagination Logic Remains the Same */}
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
                          ? "h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
                          : "h-8 w-8 p-0 border-blue-200 text-blue-700 hover:bg-blue-100"
                      }
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-700 hover:bg-blue-100"
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
