import AdminLayout from "@/components/admin/layout";
import { Card } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export default function SparePartManagement() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Wrench className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Spare Part Management</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Total Parts</h3>
            <p className="text-3xl font-bold">2,456</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Low Stock Items</h3>
            <p className="text-3xl font-bold">18</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Categories</h3>
            <p className="text-3xl font-bold">32</p>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
