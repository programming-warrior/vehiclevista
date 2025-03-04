import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { RolePermission } from "@shared/schema";

const roles = ["buyer", "seller", "trader", "garage"];
const resources = ["vehicles", "users", "api_keys"];

export default function RolePermissions() {
  const { toast } = useToast();
  
  const { data: permissions, isLoading } = useQuery<RolePermission[]>({
    queryKey: ["/api/permissions"],
  });

  const updateMutation = useMutation({
    mutationFn: async (permission: Partial<RolePermission>) => {
      await apiRequest("PATCH", `/api/permissions/${permission.id}`, permission);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePermissionChange = async (
    permissionId: number,
    field: "canCreate" | "canRead" | "canUpdate" | "canDelete",
    checked: boolean
  ) => {
    await updateMutation.mutateAsync({
      id: permissionId,
      [field]: checked,
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Role Permissions</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Create</TableHead>
              <TableHead>Read</TableHead>
              <TableHead>Update</TableHead>
              <TableHead>Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions?.map((permission) => (
              <TableRow key={permission.id}>
                <TableCell className="capitalize">{permission.role}</TableCell>
                <TableCell className="capitalize">{permission.resource}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={permission.canCreate}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(permission.id, "canCreate", checked as boolean)
                    }
                    disabled={permission.role === "admin"}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={permission.canRead}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(permission.id, "canRead", checked as boolean)
                    }
                    disabled={permission.role === "admin"}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={permission.canUpdate}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(permission.id, "canUpdate", checked as boolean)
                    }
                    disabled={permission.role === "admin"}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={permission.canDelete}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(permission.id, "canDelete", checked as boolean)
                    }
                    disabled={permission.role === "admin"}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
