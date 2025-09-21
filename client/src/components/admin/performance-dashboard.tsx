import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { getPerformanceMetrics } from "@/api";
import Loader from "../loader";

// --- TypeScript Interfaces for Type-Safety ---
interface Summary {
  totalViews: number;
  viewsGrowth: number;
  totalClicks: number;
  clicksGrowth: number;
  totalUsers?: number;      // Optional for vehicle/auction views
  userGrowth?: number;      // Optional
  totalListings: number;
}
interface ChartData {
  labels: string[];
  datasets: { [key: string]: number[] };
}
interface DataPoint {
  summary: Summary;
  chartData: ChartData;
}
interface AnalyticsData {
  overall: DataPoint;
  vehicle: DataPoint;
  auction: DataPoint;
}
type ViewType = "overall" | "vehicle" | "auction";

// --- Helper Components & Functions ---
const formatGrowth = (value: number) => {
  const rounded = Math.round(value);
  if (rounded > 0) return `+${rounded}%`;
  return `${rounded}%`;
};

const GrowthBadge = ({ value }: { value: number }) => (
  <p className={`text-xs mt-1 ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
    {value >= 0 ? <TrendingUp className="h-4 w-4 inline mr-1" /> : <TrendingDown className="h-4 w-4 inline mr-1" />}
    {formatGrowth(value)} vs. previous period
  </p>
);

const chartColors: { [key: string]: string } = {
  Views: "#3b82f6",  // blue-500
  Clicks: "#8b5cf6", // violet-500
  Users: "#10b981",  // emerald-500
};

// --- Main Dashboard Component ---
export default function PerformanceDashboard() {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("week");
  const [view, setView] = useState<ViewType>("overall");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      try {
        const data = await getPerformanceMetrics(timeframe);
        setAnalyticsData(data);
      } catch (error) {
        console.error(`Error fetching analytics for ${timeframe}:`, error);
        setAnalyticsData(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, [timeframe]);

  const currentData = useMemo(() => {
    if (!analyticsData) return null;
    return analyticsData[view];
  }, [analyticsData, view]);

  const formattedChartData = useMemo(() => {
    if (!currentData?.chartData) return [];
    return currentData.chartData.labels.map((label, index) => {
      const point: { [key: string]: string | number } = { date: label };
      for (const key in currentData.chartData.datasets) {
        point[key] = currentData.chartData.datasets[key][index] || 0;
      }
      return point;
    });
  }, [currentData]);

  if (isLoading) return <Loader />;
  if (!currentData) return <div className="text-center p-8">No performance data available for the selected period.</div>;

  const { summary } = currentData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Performance Analytics</h2>
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)}>
          <TabsList>
            <TabsTrigger value="week">Last Week</TabsTrigger>
            <TabsTrigger value="month">Last Month</TabsTrigger>
            <TabsTrigger value="year">Last Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as ViewType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overall">Overall</TabsTrigger>
          <TabsTrigger value="vehicle">Vehicles</TabsTrigger>
          <TabsTrigger value="auction">Auctions</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Views</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalViews.toLocaleString()}</div>
            <GrowthBadge value={summary.viewsGrowth} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Clicks</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalClicks.toLocaleString()}</div>
            <GrowthBadge value={summary.clicksGrowth} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Listings</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalListings.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1 capitalize">{view} listings</p>
          </CardContent>
        </Card>
        {summary.totalUsers !== undefined && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalUsers.toLocaleString()}</div>
              {summary.userGrowth !== undefined && <GrowthBadge value={summary.userGrowth} />}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="capitalize">{view} Performance Trend</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={formattedChartData}>
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString() : value} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "0.5rem" }} />
              <Legend />
              {Object.keys(currentData.chartData.datasets).map((key) => (
                <Line key={key} type="monotone" dataKey={key} name={key} stroke={chartColors[key] || "#8884d8"} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}