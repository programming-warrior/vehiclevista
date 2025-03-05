import AdminLayout from "@/components/admin/admin-layout";
import PackageSelector from "@/components/packages/package-selector";

export default function TraderPackages() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Subscription Packages</h1>
        <PackageSelector />
      </div>
    </AdminLayout>
  );
}
