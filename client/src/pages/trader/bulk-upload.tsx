import AdminLayout from "@/components/admin/admin-layout";
import BulkUpload from "@/components/admin/bulk-upload";

export default function TraderBulkUpload() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Bulk Upload</h1>
        <BulkUpload />
      </div>
    </AdminLayout>
  );
}
