// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
//   FormDescription,
// } from "@/components/ui/form";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { insertVehicleSchema, type InsertVehicle } from "@shared/schema";
// import { ImageOptimizerDialog } from "@/components/image-optimizer-dialog";
// import type { OptimizedImage } from "@/lib/image-optimizer";

// interface VehicleFormProps {
//   defaultValues?: Partial<InsertVehicle>;
//   onSubmit: (data: InsertVehicle) => Promise<void>;
//   isSubmitting?: boolean;
// }

// const conditions = [
//   { value: "clean", label: "Clean" },
//   { value: "catS", label: "Cat S (Structural Damage)" },
//   { value: "catN", label: "Cat N (Non-Structural Damage)" },
// ];

// const categories = [
//   { value: "dealer", label: "Dealer Listing" },
//   { value: "classified", label: "Classified (Private Sale)" },
//   { value: "auction", label: "Auction" },
// ];

// const contactPreferences = [
//   { value: "phone", label: "Phone Only" },
//   { value: "email", label: "Email Only" },
//   { value: "both", label: "Both Phone & Email" },
// ];

// export default function VehicleForm({
//   defaultValues,
//   onSubmit,
//   isSubmitting,
// }: VehicleFormProps) {
//   const form = useForm<InsertVehicle>({
//     resolver: zodResolver(insertVehicleSchema),
//     defaultValues: {
//       title: "",
//       price: 0,
//       year: new Date().getFullYear(),
//       make: "",
//       model: "",
//       mileage: 0,
//       fuelType: "",
//       transmission: "",
//       bodyType: "",
//       color: "",
//       description: "",
//       location: "",
//       latitude: 0,
//       longitude: 0,
//       images: [],
//       category: "classified", // Default to classified
//       openToPX: false,
//       condition: "clean",
//       sellerType: "private",
//       contactPreference: "both",
//       negotiable: true,
//       sellerId: 0, // This will be set from the logged-in user
//       ...defaultValues,
//     },
//   });

//   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
//   const [showOptimizer, setShowOptimizer] = useState(false);

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       setSelectedFiles(Array.from(e.target.files));
//       setShowOptimizer(true);
//     }
//   };

//   const handleOptimized = async (optimizedImages: OptimizedImage[]) => {
//     try {
//       const optimizedFiles = await Promise.all(
//         optimizedImages.map(async (img) => {
//           const response = await fetch(img.optimized.url);
//           const blob = await response.blob();
//           return new File([blob], "optimized_image.webp", { type: "image/webp" });
//         })
//       );

//       form.setValue("images", optimizedFiles.map(file => URL.createObjectURL(file)));
//       setSelectedFiles(optimizedFiles);
//     } catch (error) {
//       console.error("Error processing optimized images:", error);
//     }
//   };

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <FormField
//             control={form.control}
//             name="category"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Listing Type</FormLabel>
//                 <Select onValueChange={field.onChange} value={field.value}>
//                   <FormControl>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select listing type" />
//                     </SelectTrigger>
//                   </FormControl>
//                   <SelectContent>
//                     {categories.map((category) => (
//                       <SelectItem key={category.value} value={category.value}>
//                         {category.label}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 <FormDescription>
//                   Choose 'Classified' for private sale listings
//                 </FormDescription>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="price"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Price (£)</FormLabel>
//                 <FormControl>
//                   <Input 
//                     type="number" 
//                     {...field} 
//                     onChange={e => field.onChange(Number(e.target.value))}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <FormField
//             control={form.control}
//             name="condition"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Vehicle Condition</FormLabel>
//                 <Select onValueChange={field.onChange} value={field.value}>
//                   <FormControl>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select condition" />
//                     </SelectTrigger>
//                   </FormControl>
//                   <SelectContent>
//                     {conditions.map((condition) => (
//                       <SelectItem key={condition.value} value={condition.value}>
//                         {condition.label}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 <FormDescription>
//                   Choose 'Cat S' for structural damage or 'Cat N' for non-structural damage
//                 </FormDescription>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="contactPreference"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Contact Preference</FormLabel>
//                 <Select onValueChange={field.onChange} value={field.value}>
//                   <FormControl>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select contact preference" />
//                     </SelectTrigger>
//                   </FormControl>
//                   <SelectContent>
//                     {contactPreferences.map((pref) => (
//                       <SelectItem key={pref.value} value={pref.value}>
//                         {pref.label}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>

//         <div className="space-y-4">
//           <FormField
//             control={form.control}
//             name="openToPX"
//             render={({ field }) => (
//               <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
//                 <FormControl>
//                   <Checkbox
//                     checked={field.value}
//                     onCheckedChange={field.onChange}
//                   />
//                 </FormControl>
//                 <div className="space-y-1 leading-none">
//                   <FormLabel>Open to Part Exchange (PX)</FormLabel>
//                   <FormDescription>
//                     Check this if you're willing to consider vehicle part exchanges
//                   </FormDescription>
//                 </div>
//               </FormItem>
//             )}
//           />

//           <FormField
//             control={form.control}
//             name="negotiable"
//             render={({ field }) => (
//               <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
//                 <FormControl>
//                   <Checkbox
//                     checked={field.value}
//                     onCheckedChange={field.onChange}
//                   />
//                 </FormControl>
//                 <div className="space-y-1 leading-none">
//                   <FormLabel>Price Negotiable</FormLabel>
//                   <FormDescription>
//                     Check this if you're open to price negotiations
//                   </FormDescription>
//                 </div>
//               </FormItem>
//             )}
//           />
//         </div>

//         <FormField
//           control={form.control}
//           name="images"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Vehicle Images</FormLabel>
//               <FormControl>
//                 <Input
//                   type="file"
//                   multiple
//                   accept="image/*"
//                   onChange={handleFileSelect}
//                   className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
//                 />
//               </FormControl>
//               <FormDescription>
//                 Upload multiple images of the vehicle. Images will be automatically optimized for web.
//               </FormDescription>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         <Button type="submit" disabled={isSubmitting}>
//           {isSubmitting ? "Saving..." : "Save Vehicle"}
//         </Button>
//       </form>

//       <ImageOptimizerDialog
//         images={selectedFiles}
//         onOptimized={handleOptimized}
//         open={showOptimizer}
//         onOpenChange={setShowOptimizer}
//       />
//     </Form>
//   );
// }