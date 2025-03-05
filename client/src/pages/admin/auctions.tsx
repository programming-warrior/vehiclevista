import AdminLayout from "@/components/admin/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gavel, Plus, Pencil, Trash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AuctionForm } from "@/components/admin/forms/auction-form";

interface Auction {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'ended';
  currentBid: number;
  totalBids: number;
}

export default function AuctionManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: auctions, isLoading } = useQuery<Auction[]>({
    queryKey: ["/api/auctions"],
  });

  const stats = [
    {
      title: "Active Auctions",
      value: auctions?.filter(a => a.status === 'active').length || 0,
    },
    {
      title: "Total Bids Today",
      value: auctions?.reduce((acc, curr) => acc + curr.totalBids, 0) || 0,
    },
    {
      title: "Upcoming Auctions",
      value: auctions?.filter(a => a.status === 'upcoming').length || 0,
    },
  ];

  const handleAdd = () => {
    setIsAddDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    toast({
      title: "Edit Auction",
      description: `Editing auction ${id}`,
    });
  };

  const handleDelete = (id: string) => {
    toast({
      title: "Delete Auction",
      description: `Deleting auction ${id}`,
      variant: "destructive",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gavel className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Auction Management</h1>
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Auction
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-6">
              <h3 className="font-semibold mb-2">{stat.title}</h3>
              <p className="text-3xl font-bold">{stat.value}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Start Date</th>
                  <th className="px-6 py-3">End Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Current Bid</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {auctions?.map((auction) => (
                  <tr key={auction.id} className="bg-white border-b">
                    <td className="px-6 py-4">{auction.title}</td>
                    <td className="px-6 py-4">{auction.startDate}</td>
                    <td className="px-6 py-4">{auction.endDate}</td>
                    <td className="px-6 py-4">{auction.status}</td>
                    <td className="px-6 py-4">${auction.currentBid}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(auction.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(auction.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Auction</DialogTitle>
          </DialogHeader>
          <AuctionForm onSuccess={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}