import AdminLayout from "@/components/admin/admin-layout";
import PerformanceDashboard from "@/components/admin/performance-dashboard";

export default function TraderDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
        <PerformanceDashboard />
      </div>
    </AdminLayout>
  );
}
