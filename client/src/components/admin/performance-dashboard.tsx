import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPerformanceMetrics } from "@/api";
import Loader from "../loader";

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

  // Generate mini chart data for trend visualization
  const generateTrendData = (growth: number) => {
    // Create a simple 5-point trend line
    if (growth > 0) {
      return [
        { value: 10 },
        { value: 15 },
        { value: 25 },
        { value: 40 },
        { value: 50 },
      ];
    } else if (growth < 0) {
      return [
        { value: 50 },
        { value: 40 },
        { value: 25 },
        { value: 15 },
        { value: 10 },
      ];
    } else {
      return [
        { value: 30 },
        { value: 30 },
        { value: 30 },
        { value: 30 },
        { value: 30 },
      ];
    }
  };

  // Calculate overall growth metrics
  const calculateOverallGrowth = () => {
    if (!performanceMetrics) return { views: 0, clicks: 0 };
    
    const viewsGrowth = 
      (performanceMetrics.vehicleViewsGrowth || 0) + 
      (performanceMetrics.auctionViewsGrowth || 0);
    
    const clicksGrowth = 
      (performanceMetrics.vehicleClicksGrowth || 0) + 
      (performanceMetrics.auctionClicksGrowth || 0);
    
    return { views: viewsGrowth, clicks: clicksGrowth };
  };

  // Format growth numbers with + sign for positive values
  const formatGrowth = (value:number) => {
    if (value > 0) return `+${value}%`;
    return `${value}%`;
  };

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
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-2xl font-semibold">
                        {performanceMetrics.vehicleTotalViews +
                          performanceMetrics.auctionTotalViews}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${calculateOverallGrowth().views > 0 
                          ? 'text-green-600' 
                          : calculateOverallGrowth().views < 0 
                            ? 'text-red-600' 
                            : ''}`}
                      >
                        {calculateOverallGrowth().views > 0 && <TrendingUp className="h-3 w-3 inline mr-1" />}
                        {calculateOverallGrowth().views < 0 && <TrendingDown className="h-3 w-3 inline mr-1" />}
                        {formatGrowth(calculateOverallGrowth().views)}
                      </Badge>
                    </div>
                    <div className="h-12 w-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={generateTrendData(calculateOverallGrowth().views)}>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={calculateOverallGrowth().views >= 0 ? "#10b981" : "#ef4444"} 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
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
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-2xl font-semibold">
                        {performanceMetrics.vehicleTotalClicks +
                          performanceMetrics.auctionTotalClicks}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${calculateOverallGrowth().clicks > 0 
                          ? 'text-green-600' 
                          : calculateOverallGrowth().clicks < 0 
                            ? 'text-red-600' 
                            : ''}`}
                      >
                        {calculateOverallGrowth().clicks > 0 && <TrendingUp className="h-3 w-3 inline mr-1" />}
                        {calculateOverallGrowth().clicks < 0 && <TrendingDown className="h-3 w-3 inline mr-1" />}
                        {formatGrowth(calculateOverallGrowth().clicks)}
                      </Badge>
                    </div>
                    <div className="h-12 w-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={generateTrendData(calculateOverallGrowth().clicks)}>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={calculateOverallGrowth().clicks >= 0 ? "#10b981" : "#ef4444"}
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
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
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-2xl font-semibold">
                        {performanceMetrics.vehicleTotalLeads +
                          performanceMetrics.auctionTotalLeads}
                      </p>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                      >
                        No change
                      </Badge>
                    </div>
                    <div className="h-12 w-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={generateTrendData(0)}>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#9ca3af" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
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
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-2xl font-semibold">
                        {performanceMetrics.totalUsers}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        New
                      </Badge>
                    </div>
                    <div className="h-12 w-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={generateTrendData(100)}>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
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
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-2xl font-semibold">
                        {parseInt(performanceMetrics.totalVehicles) +
                          parseInt(performanceMetrics.totalAuctions)}
                      </p>
                      {/* <Badge 
                        variant="outline" 
                        className="text-xs text-green-600"
                      >
                        <TrendingUp className="h-3 w-3 inline mr-1" />
                        New
                      </Badge> */}
                    </div>
                    <div className="h-12 w-20">
                      {/* <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={generateTrendData(100)}>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer> */}
                    </div>
                  </div>
                </CardContent>
                <div className={`h-1 w-full bg-blue-500`}></div>
              </Card>
            </div>

            {/* Additional charts or metrics can be added here */}

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