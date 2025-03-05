import AdminLayout from "@/components/admin/layout";
import { Card } from "@/components/ui/card";
import { Gavel } from "lucide-react";

export default function AuctionManagement() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Gavel className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Auction Management System</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Active Auctions</h3>
            <p className="text-3xl font-bold">24</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Total Bids Today</h3>
            <p className="text-3xl font-bold">156</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Pending Approvals</h3>
            <p className="text-3xl font-bold">12</p>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
