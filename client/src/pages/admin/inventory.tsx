import AdminLayout from "@/components/admin/layout";
import { Card } from "@/components/ui/card";
import { PackageOpen } from "lucide-react";

export default function InventoryManagement() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <PackageOpen className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Inventory Management System</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Total Vehicles</h3>
            <p className="text-3xl font-bold">342</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Out of Stock</h3>
            <p className="text-3xl font-bold">12</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Value</h3>
            <p className="text-3xl font-bold">$2.4M</p>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
