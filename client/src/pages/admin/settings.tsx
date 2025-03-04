import AdminLayout from "@/components/admin/admin-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ApiKeyManager from "@/components/admin/api-key-manager";
import RolePermissions from "@/components/admin/role-permissions";
import PerformanceReport from "@/components/admin/performance-report";
import BulkUpload from "@/components/admin/bulk-upload";
import PricingPackages from "@/components/packages/pricing-packages";
import { useAuth } from "@/hooks/use-auth";

export default function AdminSettings() {
  const { user } = useAuth();
  const isTraderOrGarage = user?.role === "trader" || user?.role === "garage";

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api">API Integration</TabsTrigger>
          <TabsTrigger value="permissions">Role Permissions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          {isTraderOrGarage && (
            <>
              <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
              <TabsTrigger value="packages">Packages</TabsTrigger>
            </>
          )}
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for external service integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApiKeyManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>
                Manage access permissions for different user roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RolePermissions />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reports</CardTitle>
              <CardDescription>
                Generate and view detailed performance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceReport />
            </CardContent>
          </Card>
        </TabsContent>

        {isTraderOrGarage && (
          <>
            <TabsContent value="inventory" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Upload</CardTitle>
                  <CardDescription>
                    Upload multiple vehicle listings at once using CSV or Excel files
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BulkUpload />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="packages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Available Packages</CardTitle>
                  <CardDescription>
                    Choose a listing package that suits your needs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PricingPackages />
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                General settings will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}