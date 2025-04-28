import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Loader2 } from "lucide-react";
import type { Vehicle } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { getPerformanceMetrics } from "@/api";
import { is } from "drizzle-orm";
import Loader from "../loader";

interface PerformanceMetrics {
  totalViews: number;
  totalClicks: number;
  totalLeads: number;
  conversionRate: number;
  metrics: {
    date: string;
    views: number;
    clicks: number;
    leads: number;
  }[];
}

export default function PerformanceDashboard() {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("week");
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<any>({
    performanceMetrics: false,
  });

  useEffect(() => {
    async function fetchPerformanceMetrics() {
      try {
        setIsLoading((prev: any) => ({ ...prev, performanceMetrics: true }));

        const data = await getPerformanceMetrics();
        setPerformanceMetrics(data);
      } catch (error: any) {
        console.error("Error fetching performance metrics:", error);
      } finally {
        setIsLoading((prev: any) => ({ ...prev, performanceMetrics: false }));
      }
    }
    fetchPerformanceMetrics();
  }, []);

  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <Loader2 className="h-8 w-8 animate-spin" />
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      <div>
        {performanceMetrics && Object.keys(performanceMetrics).length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Performance Analytics</h2>
              <Tabs
                value={timeframe}
                onValueChange={(v) => setTimeframe(v as typeof timeframe)}
              >
                <TabsList>
                  <TabsTrigger value="week">Last Week</TabsTrigger>
                  <TabsTrigger value="month">Last Month</TabsTrigger>
                  <TabsTrigger value="year">Last Year</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold">
                      {performanceMetrics.vehicleTotalViews +
                        performanceMetrics.auctionTotalViews}
                    </p>
                    {/* <Badge variant="outline" className="ml-2 text-xs">
                      {stat.change}
                    </Badge> */}
                  </div>
                </CardContent>
                <div className={`h-1 w-full bg-green-500`}></div>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Clicks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold">
                      {performanceMetrics.vehicleTotalClicks +
                        performanceMetrics.auctionTotalClicks}
                    </p>
                    {/* <Badge variant="outline" className="ml-2 text-xs">
                      {stat.change}
                    </Badge> */}
                  </div>
                </CardContent>
                <div className={`h-1 w-full bg-purple-500`}></div>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold">
                      {performanceMetrics.vehicleTotalLeads +
                        performanceMetrics.auctionTotalLeads}
                    </p>
                    {/* <Badge variant="outline" className="ml-2 text-xs">
                      {stat.change}
                    </Badge> */}
                  </div>
                </CardContent>
                <div className={`h-1 w-full bg-red-500`}></div>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold">
                      {performanceMetrics.totalUsers}
                    </p>
                    {/* <Badge variant="outline" className="ml-2 text-xs">
                      {stat.change}
                    </Badge> */}
                  </div>
                </CardContent>
                <div className={`h-1 w-full bg-yellow-500`}></div>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Active Listings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold">
                      {parseInt(performanceMetrics.totalVehicles) +
                        parseInt(performanceMetrics.totalAuctions)}
                    </p>
                    {/* <Badge variant="outline" className="ml-2 text-xs">
                      {stat.change}
                    </Badge> */}
                  </div>
                </CardContent>
                <div className={`h-1 w-full bg-blue-500`}></div>
              </Card>
              {/* <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(metrics?.conversionRate || 0).toFixed(1)}%
                  </div>
                </CardContent>
              </Card> */}
            </div>


            {/* <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={metrics?.metrics}>
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Bar dataKey="views" fill="hsl(var(--primary))" name="Views" />
              <Bar
                dataKey="clicks"
                fill="hsl(var(--secondary))"
                name="Clicks"
              />
              <Bar dataKey="leads" fill="hsl(var(--accent))" name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card> */}
          </div>
        ) : isLoading.performanceMetrics ? (
          <Loader />
        ) : (
          "No data available"
        )}
      </div>
    </div>
  );
}
