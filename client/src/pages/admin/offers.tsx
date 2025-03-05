import AdminLayout from "@/components/admin/layout";
import { Card } from "@/components/ui/card";
import { Tag } from "lucide-react";

export default function OfferManagement() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Tag className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Offer Management System</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Active Offers</h3>
            <p className="text-3xl font-bold">16</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Redeemed Today</h3>
            <p className="text-3xl font-bold">45</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Expiring Soon</h3>
            <p className="text-3xl font-bold">8</p>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
