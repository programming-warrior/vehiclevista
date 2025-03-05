import AdminLayout from "@/components/admin/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, Plus, Pencil, Trash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PricingForm } from "@/components/admin/forms/pricing-form";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  status: 'active' | 'draft' | 'archived';
  subscriptions: number;
}

export default function PricingManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: plans, isLoading } = useQuery<PricingPlan[]>({
    queryKey: ["/api/pricing-plans"],
  });

  const stats = [
    {
      title: "Active Plans",
      value: plans?.filter(plan => plan.status === 'active').length || 0,
    },
    {
      title: "Total Subscriptions",
      value: plans?.reduce((acc, curr) => acc + curr.subscriptions, 0) || 0,
    },
    {
      title: "Draft Plans",
      value: plans?.filter(plan => plan.status === 'draft').length || 0,
    },
  ];

  const handleAdd = () => {
    setIsAddDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    toast({
      title: "Edit Plan",
      description: `Editing pricing plan ${id}`,
    });
  };

  const handleDelete = (id: string) => {
    toast({
      title: "Delete Plan",
      description: `Deleting pricing plan ${id}`,
      variant: "destructive",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Pricing Management</h1>
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Plan
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
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Billing Cycle</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Subscriptions</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans?.map((plan) => (
                  <tr key={plan.id} className="bg-white border-b">
                    <td className="px-6 py-4">{plan.name}</td>
                    <td className="px-6 py-4">{plan.description}</td>
                    <td className="px-6 py-4">${plan.price}</td>
                    <td className="px-6 py-4">{plan.billingCycle}</td>
                    <td className="px-6 py-4">{plan.status}</td>
                    <td className="px-6 py-4">{plan.subscriptions}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(plan.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(plan.id)}
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
            <DialogTitle>Add New Pricing Plan</DialogTitle>
          </DialogHeader>
          <PricingForm onSuccess={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}