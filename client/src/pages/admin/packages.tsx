import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import AdminLayout from "@/components/admin/layout";
import {
  adminGetPackages,
  adminAddPackage,
  adminUpdatePackage,
  adminTogglePackageActive,
} from "@/api";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  Clock,
  Edit,
  PlusCircle,
  Star,
  AlertCircle,
  Loader2,
  DollarSign,
  ListChecks,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

// Helper to format currency
const formatCurrency = (price: number) => `£${price.toLocaleString()}`;

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    totalPages: 1,
    total: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any | null>(null);
  const { toast } = useToast();

  // Fetch packages from the server
  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const data = await adminGetPackages({
        page: pagination.page,
        limit: pagination.limit,
      });
      setPackages(data.packages || []);
      setPagination((prev) => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages,
      }));
    } catch (e: any) {
      toast({
        title: "Failed to Fetch Packages",
        description: e.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on initial load or when page changes
  useEffect(() => {
    fetchPackages();
  }, [pagination.page, pagination.limit]);

  const handleAddNew = () => {
    setEditingPackage(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (pkg: any) => {
    setEditingPackage(pkg);
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (id: number) => {
    try {
      await adminTogglePackageActive(id);
      toast({
        title: "Success",
        description: "Package status updated successfully.",
      });
      fetchPackages(); // Refresh the list
    } catch (e: any) {
      toast({
        title: "Update Failed",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const onFormSubmitSuccess = () => {
    setIsDialogOpen(false);
    fetchPackages(); // Refresh data
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-white shadow-sm border border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Package Management</h2>
            <p className="text-gray-500">Add, edit, and manage pricing packages.</p>
          </div>
          <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Package
          </Button>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[450px] w-full bg-gray-200" />)}
          </div>
        ) : packages.length === 0 ? (
          <Alert className="bg-blue-50 border-blue-200 text-blue-800">
            <AlertCircle className="h-4 w-4 !text-blue-800" />
            <AlertTitle>No Packages Found</AlertTitle>
            <AlertDescription>
              There are no packages to display. Click "Add New Package" to get started.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <AdminPackageCard key={pkg.id} pkg={pkg} onEdit={handleEdit} onToggleActive={handleToggleActive} />
            ))}
          </div>
        )}

        {/* Pagination */}
        <PaginationControls pagination={pagination} setPagination={setPagination} isLoading={isLoading} />

        {/* Add/Edit Dialog */}
        {isDialogOpen && (
          <PackageFormDialog
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            pkg={editingPackage}
            onSuccess={onFormSubmitSuccess}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// --- Admin Package Card Component ---
function AdminPackageCard({ pkg, onEdit, onToggleActive }: { pkg: any, onEdit: (pkg: any) => void, onToggleActive: (id: number) => void }) {
  const isUltra = pkg.name.toLowerCase().includes("ultra");
  return (
      <Card className={`flex flex-col border-2 rounded-xl shadow-md transition-all hover:shadow-xl hover:-translate-y-1 ${
          pkg.is_active ? (isUltra ? 'border-blue-500 bg-white' : 'border-gray-200 bg-white') : 'border-red-300 bg-red-50'
      }`}>
          <CardHeader className={`pb-4 rounded-t-xl ${isUltra ? 'bg-blue-500 text-white' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                  <CardTitle className={`text-xl font-bold ${isUltra ? 'text-white' : 'text-gray-900'}`}>{pkg.name}</CardTitle>
                  {isUltra && <Star className="h-5 w-5 text-white fill-white" />}
              </div>
              <div className="flex items-center gap-4 text-sm">
                  <Badge variant={isUltra ? 'secondary' : 'outline'} className={isUltra ? 'bg-white/20 text-white' : ''}>{pkg.type}</Badge>
                  <div className={`flex items-center gap-1.5 ${isUltra ? 'text-blue-100' : 'text-gray-600'}`}>
                      <Clock className="h-4 w-4" />
                      <span>{pkg.is_until_sold ? "Until Sold" : `${pkg.duration_days} days`}</span>
                  </div>
              </div>
          </CardHeader>
          <CardContent className="flex-grow p-6 space-y-6">
              <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><DollarSign className="h-5 w-5 text-blue-500"/> Pricing Tiers</h4>
                  <div className="space-y-2">
                      {(pkg.prices as any[]).map((tier, index) => (
                          <div key={index} className="flex justify-between items-center text-sm p-2 rounded-md bg-blue-50/70">
                              <span className="text-gray-600">
                                  {formatCurrency(tier[0])} - {tier[1] === -1 ? 'Above' : formatCurrency(tier[1])}
                              </span>
                              <span className="font-bold text-blue-700">{formatCurrency(tier[2])}</span>
                          </div>
                      ))}
                  </div>
              </div>
              <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><ListChecks className="h-5 w-5 text-blue-500"/> Features</h4>
                  <ul className="space-y-2.5">
                      {(pkg.features as string[]).map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-700">{feature}</span>
                          </li>
                      ))}
                  </ul>
              </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t bg-gray-50/50 p-4">
               <div className="flex items-center justify-between w-full">
                  <Label htmlFor={`active-toggle-${pkg.id}`} className="font-medium text-gray-700">Status</Label>
                  <div className="flex items-center space-x-2">
                      <Switch
                          id={`active-toggle-${pkg.id}`}
                          checked={pkg.is_active}
                          onCheckedChange={() => onToggleActive(pkg.id)}
                      />
                      <span className={`text-sm font-semibold ${pkg.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {pkg.is_active ? 'Active' : 'Inactive'}
                      </span>
                  </div>
              </div>
              <Button className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-100" variant="outline" onClick={() => onEdit(pkg)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Package
              </Button>
          </CardFooter>
      </Card>
  );
}

// --- NEW: Price Tiers Input Component ---
function PriceTiersInput({ prices, setFormData }: { prices: [number, number, number][], setFormData: React.Dispatch<any> }) {

  const handlePriceChange = (index: number, tierIndex: 0 | 1 | 2, value: string) => {
    const newPrices = [...prices];
    newPrices[index][tierIndex] = value === '' ? 0 : parseInt(value, 10);
    setFormData((prev: any) => ({ ...prev, prices: newPrices }));
  };

  const addTier = () => {
    const newPrices = [...prices, [0, 0, 0]];
    setFormData((prev: any) => ({ ...prev, prices: newPrices }));
  };

  const removeTier = (index: number) => {
    const newPrices = prices.filter((_, i) => i !== index);
    setFormData((prev: any) => ({ ...prev, prices: newPrices }));
  };

  return (
    <div className="grid col-span-4 gap-2">
        <Label htmlFor="prices" className="text-left">
            Prices <span className="text-xs text-muted-foreground">(Min Value, Max Value, Price)</span>
        </Label>
        <div className="space-y-3">
        {prices.map((tier, index) => (
            <div key={index} className="flex items-center gap-2">
            <Input type="number" placeholder="Min" value={tier[0]} onChange={(e) => handlePriceChange(index, 0, e.target.value)} />
            <Input type="number" placeholder="Max" value={tier[1]} onChange={(e) => handlePriceChange(index, 1, e.target.value)} />
            <Input type="number" placeholder="Price" value={tier[2]} onChange={(e) => handlePriceChange(index, 2, e.target.value)} />
            <Button type="button" className="px-2 py-1" variant="destructive" size="icon" onClick={() => removeTier(index)} disabled={prices.length <= 1}>
                <Trash2 className="h-4 w-4" />
            </Button>
            </div>
        ))}
        </div>
        <p className="text-xs text-muted-foreground">Use a Max Value of -1 for 'and above'.</p>
        <Button type="button" variant="outline" size="sm" onClick={addTier} className="mt-2">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Price Tier
        </Button>
    </div>
  )
}

// --- NEW: Features Input Component ---
function FeaturesInput({ features, setFormData }: { features: string[], setFormData: React.Dispatch<any> }) {

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFormData((prev: any) => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    const newFeatures = [...features, ''];
    setFormData((prev: any) => ({ ...prev, features: newFeatures }));
  };

  const removeFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    setFormData((prev: any) => ({ ...prev, features: newFeatures }));
  };

  return (
    <div className="grid col-span-4 gap-2">
        <Label htmlFor="features" className="text-left">Features</Label>
        <div className="space-y-3">
        {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
            <Input
                type="text"
                placeholder={`Feature ${index + 1}`}
                value={feature}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
            />
            <Button type="button" variant="destructive" size="icon" onClick={() => removeFeature(index)}>
                <Trash2 className="h-4 w-4" />
            </Button>
            </div>
        ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addFeature} className="mt-2">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Feature
        </Button>
    </div>
  )
}


// --- UPDATED: Add/Edit Dialog Component ---
function PackageFormDialog({
  isOpen,
  setIsOpen,
  pkg,
  onSuccess,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  pkg: any | null;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<any>({
    name: pkg?.name ?? "",
    type: pkg?.type ?? "CLASSIFIED",
    // Use arrays directly, not JSON strings
    prices: pkg?.prices ?? [[0, -1, 0]],
    duration_days: pkg?.duration_days ?? 14,
    features: pkg?.features ?? ["Feature 1", "Feature 2"],
    is_until_sold: pkg?.is_until_sold ?? false,
    youtubeShowcase: pkg?.youtubeShowcase ?? false,
    premiumPlacement: pkg?.premiumPlacement ?? false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // This handler is now only for simple input fields
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
     setFormData((prev: any) => ({ ...prev, [name]: checked }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // The `formData` object is now ready to be sent directly.
      // No more JSON.parse is needed.
      if (pkg) {
        await adminUpdatePackage(pkg.id, formData);
        toast({
          title: "Success",
          description: "Package updated successfully.",
        });
      } else {
        await adminAddPackage(formData);
        toast({
          title: "Success",
          description: "Package created successfully.",
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Submission Error",
        description: error.message || "An unexpected error occurred. Please check the form.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {pkg ? "Edit Package" : "Add New Package"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                name="type"
                value={formData.type}
                onValueChange={(v) => handleSelectChange("type", v)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLASSIFIED">Classified</SelectItem>
                  <SelectItem value="AUCTION-VEHICLE">
                    Auction Vehicle
                  </SelectItem>
                  <SelectItem value="AUCTION-NUMBERPLATE">
                    Auction Numberplate
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration_days" className="text-right">
                Duration (days)
              </Label>
              <Input
                id="duration_days"
                name="duration_days"
                type="number"
                value={formData.duration_days}
                onChange={handleChange}
                className="col-span-3"
                required
                disabled={formData.is_until_sold}
              />
            </div>
            
            {/* --- REPLACEMENT FOR PRICES TEXTAREA --- */}
            <PriceTiersInput prices={formData.prices} setFormData={setFormData} />

            {/* --- REPLACEMENT FOR FEATURES TEXTAREA --- */}
            <FeaturesInput features={formData.features} setFormData={setFormData} />

            <div className="col-span-4 space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_until_sold">List Until Sold</Label>
                <Switch
                  id="is_until_sold"
                  checked={formData.is_until_sold}
                  onCheckedChange={(c) => handleSwitchChange("is_until_sold", c)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="youtubeShowcase">YouTube Showcase</Label>
                <Switch
                  id="youtubeShowcase"
                  checked={formData.youtubeShowcase}
                  onCheckedChange={(c) => handleSwitchChange("youtubeShowcase", c)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="premiumPlacement">Premium Placement</Label>
                <Switch
                  id="premiumPlacement"
                  checked={formData.premiumPlacement}
                  onCheckedChange={(c) => handleSwitchChange("premiumPlacement", c)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Pagination Controls Component ---
function PaginationControls({
    pagination,
    setPagination,
    isLoading,
}: {
    pagination: any;
    setPagination: any;
    isLoading: boolean;
}) {
    if (pagination.totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                Showing <strong>{(pagination.page - 1) * pagination.limit + 1}</strong>{" "}
                -{" "}
                <strong>
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                </strong>{" "}
                of <strong>{pagination.total}</strong> packages
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        setPagination((prev: any) => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={pagination.page === 1 || isLoading}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        setPagination((prev: any) => ({ ...prev, page: prev.page + 1 }))
                    }
                    disabled={pagination.page === pagination.totalPages || isLoading}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}