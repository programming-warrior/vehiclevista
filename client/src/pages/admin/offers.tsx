import AdminLayout from "@/components/admin/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag, Plus, Pencil, Trash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { OfferForm } from "@/components/admin/forms/offer-form";

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  type: 'percentage' | 'fixed';
  validFrom: string;
  validTo: string;
  status: 'active' | 'draft' | 'expired';
  redemptions: number;
}

export default function OfferManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: offers, isLoading } = useQuery<Offer[]>({
    queryKey: ["/api/offers"],
  });

  const stats = [
    {
      title: "Active Offers",
      value: offers?.filter(o => o.status === 'active').length || 0,
    },
    {
      title: "Total Redemptions",
      value: offers?.reduce((acc, curr) => acc + curr.redemptions, 0) || 0,
    },
    {
      title: "Expiring Soon",
      value: offers?.filter(o => {
        const daysUntilExpiry = Math.ceil(
          (new Date(o.validTo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
      }).length || 0,
    },
  ];

  const handleAdd = () => {
    setIsAddDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    toast({
      title: "Edit Offer",
      description: `Editing offer ${id}`,
    });
  };

  const handleDelete = (id: string) => {
    toast({
      title: "Delete Offer",
      description: `Deleting offer ${id}`,
      variant: "destructive",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Offer Management</h1>
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Offer
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
                  <th className="px-6 py-3">Discount</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Valid From</th>
                  <th className="px-6 py-3">Valid To</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Redemptions</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers?.map((offer) => (
                  <tr key={offer.id} className="bg-white border-b">
                    <td className="px-6 py-4">{offer.title}</td>
                    <td className="px-6 py-4">
                      {offer.type === 'percentage' ? `${offer.discount}%` : `$${offer.discount}`}
                    </td>
                    <td className="px-6 py-4">{offer.type}</td>
                    <td className="px-6 py-4">{offer.validFrom}</td>
                    <td className="px-6 py-4">{offer.validTo}</td>
                    <td className="px-6 py-4">{offer.status}</td>
                    <td className="px-6 py-4">{offer.redemptions}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(offer.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(offer.id)}
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
            <DialogTitle>Add New Offer</DialogTitle>
          </DialogHeader>
          <OfferForm onSuccess={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}