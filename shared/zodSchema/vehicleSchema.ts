import z from "zod";

export const vehicleTransmissionsTypes = {
  car: ["manual", "automatic", "semi-automatic"],
  bike: ["manual"],
  truck: ["manual", "automatic"],
  van: ["manual", "automatic"],
};

export const vehicleFuelTypes = {
  car: ["petrol", "diesel", "electric", "hybrid"],
  bike: ["petrol", "electric"],
  van: ["petrol", "diesel", "electric"],
  truck: ["petrol", "diesel"],
};


export const vehicleUploadSchema = z.object({
  type: z.enum(["car", "bike", "truck", "van"], {
    required_error: "Type is required",
  }),
  make: z.string().min(1, { message: "Make is required" }),
  model: z.string().min(1, { message: "Model is required" }),
  registration_num: z
    .string()
    .min(1, { message: "Registration number is required" }),
  price: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Price must be a valid number",
    }),
  year: z
    .string()
    .refine((val) => !isNaN(parseInt(val)), {
      message: "Year must be a valid number",
    }),
  mileage: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Mileage must be a valid number",
    }),
  title: z.string().min(1, { message: "Title is required" }),
  fuelType: z.string().min(1, { message: "Fuel type is required" }),
  transmission: z.string().min(1, { message: "Transmission is required" }),
  bodyType: z.string().min(1, { message: "Body type is required" }),
  color: z.string().min(1, { message: "Color is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  location: z.string().min(1, { message: "Location is required" }),
  latitude: z.number().min(-90).max(90, { message: "Latitude is required" }).optional(),
  longitude: z
    .number()
    .min(-180)
    .max(180, { message: "Longitude is required" }).optional(),
  images: z
    .array(z.string()),
  condition: z.enum(["clean", "catS", "catN"], {
    required_error: "Condition is required",
  }),
  openToPX: z.boolean().optional(),
  contactPreference: z.enum(["phone", "email", "both"], {
    required_error: "Contact preference is required",
  }).optional(),
  // listingStatus: z.enum(["active", "inactive"], { required_error: "Listing status is required" }),
  negotiable: z.boolean().optional(),
});
