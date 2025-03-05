import AdminLayout from "@/components/admin/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Plus, Pencil, Trash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface SparePart {
  id: string;
  name: string;
  partNumber: string;
  manufacturer: string;
  category: string;
  price: number;
  stockLevel: number;
  status: 'available' | 'out-of-stock' | 'discontinued';
}

export default function SparePartManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: spareParts, isLoading } = useQuery<SparePart[]>({
    queryKey: ["/api/spare-parts"],
  });

  const stats = [
    {
      title: "Total Parts",
      value: spareParts?.length || 0,
    },
    {
      title: "Out of Stock",
      value: spareParts?.filter(part => part.status === 'out-of-stock').length || 0,
    },
    {
      title: "Available Parts",
      value: spareParts?.filter(part => part.status === 'available').length || 0,
    },
  ];

  const handleAdd = () => {
    setIsAddDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    toast({
      title: "Edit Spare Part",
      description: `Editing spare part ${id}`,
    });
  };

  const handleDelete = (id: string) => {
    toast({
      title: "Delete Spare Part",
      description: `Deleting spare part ${id}`,
      variant: "destructive",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Spare Parts Management</h1>
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Part
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
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Part Number</th>
                  <th className="px-6 py-3">Manufacturer</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Stock Level</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {spareParts?.map((part) => (
                  <tr key={part.id} className="bg-white border-b">
                    <td className="px-6 py-4">{part.name}</td>
                    <td className="px-6 py-4">{part.partNumber}</td>
                    <td className="px-6 py-4">{part.manufacturer}</td>
                    <td className="px-6 py-4">{part.category}</td>
                    <td className="px-6 py-4">${part.price}</td>
                    <td className="px-6 py-4">{part.stockLevel}</td>
                    <td className="px-6 py-4">{part.status}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(part.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(part.id)}
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
            <DialogTitle>Add New Spare Part</DialogTitle>
          </DialogHeader>
          {/* Add Spare Part Form will go here */}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}