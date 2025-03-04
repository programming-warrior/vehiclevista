import AdminLayout from "@/components/admin/admin-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import type { Vehicle } from "@shared/schema";

export default function AdminVehicles() {
  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-8">Vehicle Management</h1>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              vehicles?.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>{vehicle.title}</TableCell>
                  <TableCell>£{vehicle.price.toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{vehicle.category}</TableCell>
                  <TableCell>{vehicle.location}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
