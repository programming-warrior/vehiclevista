import AdminLayout from "@/components/admin/layout";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function FeedbackManagement() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Feedback Management System</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">New Feedback</h3>
            <p className="text-3xl font-bold">15</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Resolved Issues</h3>
            <p className="text-3xl font-bold">89</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Average Rating</h3>
            <p className="text-3xl font-bold">4.5</p>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
