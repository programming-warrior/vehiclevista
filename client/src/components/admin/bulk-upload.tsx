import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BulkUpload } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function BulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: uploads, isLoading } = useQuery<BulkUpload[]>({
    queryKey: ["/api/bulk-uploads"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      await apiRequest("POST", "/api/bulk-uploads", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-uploads"] });
      toast({
        title: "Success",
        description: "File uploaded successfully. Processing will begin shortly.",
      });
      setFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (file) {
      await uploadMutation.mutateAsync(file);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return <Upload className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
        <Button 
          onClick={handleUpload} 
          disabled={!file || uploadMutation.isPending}
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload"
          )}
        </Button>
      </div>

      <div className="grid gap-4">
        <h2 className="text-lg font-semibold">Recent Uploads</h2>
        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : uploads?.length === 0 ? (
          <p className="text-muted-foreground">No uploads found</p>
        ) : (
          uploads?.map((upload) => (
            <Card key={upload.id}>
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {getStatusIcon(upload.status)}
                    {upload.fileName}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(upload.createdAt).toLocaleDateString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>
                      {upload.processedVehicles} / {upload.totalVehicles || "?"}
                    </span>
                  </div>
                  <Progress
                    value={
                      upload.totalVehicles
                        ? (upload.processedVehicles / upload.totalVehicles) * 100
                        : 0
                    }
                  />
                  {upload.status === "failed" && upload.errors && (
                    <div className="mt-2 text-sm text-red-500">
                      {upload.errors.map((error, index) => (
                        <div key={index}>{JSON.stringify(error)}</div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
