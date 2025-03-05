import AdminLayout from "@/components/admin/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PackageOpen, Plus, Pencil, Trash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { InventoryForm } from "@/components/admin/forms/inventory-form";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: string;
}

export default function InventoryManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: inventory, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const stats = [
    {
      title: "Total Items",
      value: inventory?.length || 0,
    },
    {
      title: "Out of Stock",
      value: inventory?.filter(item => item.status === 'out-of-stock').length || 0,
    },
    {
      title: "Low Stock",
      value: inventory?.filter(item => item.status === 'low-stock').length || 0,
    },
  ];

  const handleAdd = () => {
    setIsAddDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    toast({
      title: "Edit Item",
      description: `Editing item ${id}`,
    });
  };

  const handleDelete = (id: string) => {
    toast({
      title: "Delete Item",
      description: `Deleting item ${id}`,
      variant: "destructive",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageOpen className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Inventory Management</h1>
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Item
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
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Last Updated</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory?.map((item) => (
                  <tr key={item.id} className="bg-white border-b">
                    <td className="px-6 py-4">{item.name}</td>
                    <td className="px-6 py-4">{item.category}</td>
                    <td className="px-6 py-4">{item.quantity}</td>
                    <td className="px-6 py-4">${item.price}</td>
                    <td className="px-6 py-4">{item.status}</td>
                    <td className="px-6 py-4">{item.lastUpdated}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
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
            <DialogTitle>Add New Inventory Item</DialogTitle>
          </DialogHeader>
          <InventoryForm onSuccess={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}