import AdminLayout from "@/components/admin/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Pencil, Trash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Feedback {
  id: string;
  subject: string;
  message: string;
  status: 'new' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  submittedBy: string;
  submittedAt: string;
}

export default function FeedbackManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: feedbacks, isLoading } = useQuery<Feedback[]>({
    queryKey: ["/api/feedbacks"],
  });

  const stats = [
    {
      title: "New Feedback",
      value: feedbacks?.filter(f => f.status === 'new').length || 0,
    },
    {
      title: "In Progress",
      value: feedbacks?.filter(f => f.status === 'in-progress').length || 0,
    },
    {
      title: "Resolved",
      value: feedbacks?.filter(f => f.status === 'resolved').length || 0,
    },
  ];

  const handleAdd = () => {
    setIsAddDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    toast({
      title: "Edit Feedback",
      description: `Editing feedback ${id}`,
    });
  };

  const handleDelete = (id: string) => {
    toast({
      title: "Delete Feedback",
      description: `Deleting feedback ${id}`,
      variant: "destructive",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Feedback Management</h1>
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Feedback
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
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Submitted By</th>
                  <th className="px-6 py-3">Submitted At</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks?.map((feedback) => (
                  <tr key={feedback.id} className="bg-white border-b">
                    <td className="px-6 py-4">{feedback.subject}</td>
                    <td className="px-6 py-4">{feedback.status}</td>
                    <td className="px-6 py-4">{feedback.priority}</td>
                    <td className="px-6 py-4">{feedback.submittedBy}</td>
                    <td className="px-6 py-4">{feedback.submittedAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(feedback.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(feedback.id)}
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
            <DialogTitle>Add New Feedback</DialogTitle>
          </DialogHeader>
          {/* Add Feedback Form will go here */}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}