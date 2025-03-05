import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "@/components/admin/admin-layout";
import BulkUpload from "@/components/admin/bulk-upload";
import PerformanceDashboard from "@/components/admin/performance-dashboard";
import PackageSelector from "@/components/packages/package-selector";

export default function AdminDashboard() {
  const { user } = useAuth();
  const isTraderOrGarage = user?.role === "trader" || user?.role === "garage";

  return (
    <AdminLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        <Tabs defaultValue="performance">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            {isTraderOrGarage && (
              <>
                <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
                <TabsTrigger value="packages">Packages</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="performance" className="space-y-8">
            <PerformanceDashboard />
          </TabsContent>

          {isTraderOrGarage && (
            <>
              <TabsContent value="bulk-upload" className="space-y-8">
                <BulkUpload />
              </TabsContent>

              <TabsContent value="packages" className="space-y-8">
                <PackageSelector />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
