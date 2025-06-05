import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getPresignedUrls,
  uploadToPresignedUrl,
  createNumberPlate,
  UpdateDraftAuctionWithItemDraft
} from "@/api";


// Schema for number plate registration
const formSchema = z.object({
  plate_number: z.string().min(1, "Plate number is required"),
  seller_id: z.number().min(1, "Seller ID is required"),
  documents: z
    .array(z.instanceof(File))
    .min(1, "At least one document is required"),
});

const NumberPlateForm = ({
  auctionDraftId,
  pullData,
}: {
  auctionDraftId: number;
  pullData?: (data: any) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  type FormSchemaType = z.infer<typeof formSchema>;
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plate_number: "",
      seller_id: undefined,
      documents: [],
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = [...uploadedFiles, ...files];
      setUploadedFiles(newFiles);
      form.setValue("documents", newFiles);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    form.setValue("documents", newFiles);
  };

  async function onSubmit(data: any) {
    setIsLoading(true);
    try {
      let documentUrls: string[] = [];

      if (data.documents.length > 0) {
        const fileKeys = data.documents.map((file: File) => ({
          fileName: `${Date.now()}-${file.name.split(" ").join("")}`,
          contentType: file.type,
        }));

        const presignedUrlsResponse = await getPresignedUrls(fileKeys);
        const presignedUrls = presignedUrlsResponse.data.urls;

        const uploadPromises = data.documents.map((file: File, index: number) =>
          uploadToPresignedUrl(file, presignedUrls[index])
        );

        // Track progress
        let completed = 0;
        for (const promise of uploadPromises) {
          await promise.then((url: string) => {
            documentUrls.push(url);
            completed++;
            // setUploadProgress(
            //   Math.floor((completed / uploadPromises.length) * 100)
            // );
          });
        }
      }

      const plateData = {
        plate_number: data.plate_number,
        document_url: documentUrls,
      };

      const res = await createNumberPlate(plateData);

      if (auctionDraftId)
        await UpdateDraftAuctionWithItemDraft(
          auctionDraftId,
          res.draftId,
          "NUMBERPLATE"
        );
      if (pullData && typeof pullData === "function") {
        pullData({ ...plateData, draftId: res.draftId });
      }

      toast({
        title: "Success!",
        description: "Number plate registered successfully.",
      });

      // Reset form after successful submission
      form.reset();
      setUploadedFiles([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to register number plate",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-blue-100">
      <CardHeader className="bg-blue-50 border-b border-blue-100">
        <CardTitle className="text-xl text-blue-800">
          Number Plate Details
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6">
        <Form {...form}>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="plate_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-800">Plate Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter plate number (e.g., ABC-123)"
                      className="border-blue-200 focus:ring-blue-500 focus:border-blue-500 uppercase"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seller_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-800">Seller ID</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter seller ID"
                      className="border-blue-200 focus:ring-blue-500 focus:border-blue-500"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-800">Documents</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-blue-500" />
                            <p className="mb-2 text-sm text-blue-700">
                              <span className="font-semibold">
                                Click to upload
                              </span>{" "}
                              documents
                            </p>
                            <p className="text-xs text-blue-600">
                              PDF, PNG, JPG up to 10MB
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>

                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-blue-800">
                            Uploaded Files ({uploadedFiles.length}):
                          </p>
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-blue-50 rounded-md border border-blue-200"
                            >
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-blue-800 truncate">
                                  {file.name}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
              onClick={form.handleSubmit(onSubmit)}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Add Number Plate
                </div>
              )}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};

export default NumberPlateForm;
