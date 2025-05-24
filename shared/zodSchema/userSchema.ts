import * as z from "zod";


export const userRegisterSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters" })
      .max(50, { message: "Username must be less than 50 characters" })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: "Username can only contain letters, numbers, and underscores",
      }),

    email: z.string().email({ message: "Invalid email address" }),

   password: z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
    {
      message:
        "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
    }
  ),

    confirmPassword: z.string(),

    role: z.enum(["buyer", "seller", "trader", "garage"], {
      required_error: "Please select an account type",
    }).optional(),

    businessName: z.string().optional(),
    businessAddress: z.string().optional(),

    card: z.object({paymentMethodId: z.string()}).optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (["trader", "garage"].includes(data.role as string)) {
        return data.businessName;
      }
      return true;
    },
    {
      message: "Business name is required for traders and garages",
      path: ["businessName"],
    }
  )
  .refine(
    (data) => {
      if (["trader", "garage"].includes(data.role as string)) {
        return data.businessAddress;
      }
      return true;
    },
    {
      message: "Business Address is required for traders and garages",
      path: ["businessAddress"],
    }
  );