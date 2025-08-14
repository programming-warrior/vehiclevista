
import * as z from "zod";


const packageSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, "Name must be at least 3 characters long."),
  type: z.enum(["CLASSIFIED", "AUCTION-VEHICLE", "AUCTION-NUMBERPLATE"]),
  prices: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed);
    } catch (e) {
      return false;
    }
  }, { message: "Prices must be a valid JSON array." }),
  duration_days: z.coerce.number().int().positive("Duration must be a positive number."),
  features: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) && parsed.every(item => typeof item === 'string');
    } catch (e) {
      return false;
    }
  }, { message: "Features must be a valid JSON array of strings." }),
  is_until_sold: z.boolean().default(false),
  youtubeShowcase: z.boolean().default(false),
  premiumPlacement: z.boolean().default(false),
  is_active: z.boolean().optional(),
});

export type PackagePayload = z.infer<typeof packageSchema>;

