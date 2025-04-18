import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { uploadBulkVehicle } from "@/api";
import { useLocation } from "wouter";

export default function SellerVehilceBulkUpload() {
  const {toast} = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [,setLocation] = useLocation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title:"No file selected",
      })
      return;
    }

    const formData = new FormData();
    formData.append("csv", file);

    setIsUploading(true);
    try {
      await uploadBulkVehicle(formData)
      toast({
        title:"Upload Successful!",
      })
      setFile(null);
      setLocation('/seller')
    } catch (err:any) {
        toast({
            variant: 'destructive',
            title:"Upload Failed",
            description: err.message
          })
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload Vehicles</CardTitle>
        </CardHeader>
        <Separator className="mb-4" />
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="csv">Upload CSV File</Label>
            <Input
              id="csv"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-2"
            />
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Make sure your CSV includes headers like <code>make, model, year, price, image_urls</code>.<br />
            Use semicolon (;) to separate multiple image URLs.
          </p>

          <div className="flex items-center gap-4">
            <Button
              disabled={isUploading || !file}
              onClick={handleUpload}
            >
              {isUploading ? "Uploading..." : "Submit CSV"}
            </Button>

            <a
              href="/src/templates/vehicle_bulk_upload_template.csv"
              className="text-blue-600 text-sm hover:underline"
              download
            >
              Download CSV Template
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
