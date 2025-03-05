import AdminLayout from "@/components/admin/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Vehicle } from "@shared/schema";

export default function AdminDashboard() {
  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const stats = [
    {
      title: "Total Vehicles",
      value: vehicles?.length || 0,
    },
    {
      title: "Active Listings",
      value: vehicles?.filter(v => v.listingStatus === "active").length || 0,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Total Vehicles</h3>
            <p className="text-3xl font-bold">{vehicles?.length || 0}</p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Active Listings</h3>
            <p className="text-3xl font-bold">
              {vehicles?.filter(v => v.listingStatus === "active").length || 0}
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold">0</p>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}