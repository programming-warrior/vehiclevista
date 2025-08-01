import AdminLayout from "@/components/admin/layout";
import { useQuery } from "@tanstack/react-query";
import type { Vehicle } from "@shared/schema";

export default function AdminPaymentHistory() {
  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
      
      </div>
    </AdminLayout>
  );
}