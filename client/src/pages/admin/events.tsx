import AdminLayout from "@/components/admin/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Pencil, Trash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  attendees: number;
}

export default function EventManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const stats = [
    {
      title: "Upcoming Events",
      value: events?.filter(e => e.status === 'upcoming').length || 0,
    },
    {
      title: "Active Events",
      value: events?.filter(e => e.status === 'ongoing').length || 0,
    },
    {
      title: "Total Attendees",
      value: events?.reduce((acc, curr) => acc + curr.attendees, 0) || 0,
    },
  ];

  const handleAdd = () => {
    setIsAddDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    toast({
      title: "Edit Event",
      description: `Editing event ${id}`,
    });
  };

  const handleDelete = (id: string) => {
    toast({
      title: "Delete Event",
      description: `Deleting event ${id}`,
      variant: "destructive",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Event Management</h1>
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Event
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
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Attendees</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events?.map((event) => (
                  <tr key={event.id} className="bg-white border-b">
                    <td className="px-6 py-4">{event.title}</td>
                    <td className="px-6 py-4">{event.date}</td>
                    <td className="px-6 py-4">{event.location}</td>
                    <td className="px-6 py-4">{event.type}</td>
                    <td className="px-6 py-4">{event.status}</td>
                    <td className="px-6 py-4">{event.attendees}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(event.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
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
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          {/* Add Event Form will go here */}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}