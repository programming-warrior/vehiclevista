import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useHeroSectionSearch } from "@/hooks/use-store";
import { useLocation } from "wouter";


export default function HeroSection() {
  // Define complete form validation schema with Zod
  const formSchema = z.object({
    brand: z.string(),
    model: z.string(),
    variant: z.string(),
    minBudget: z.coerce
      .number()
      .min(0, "Minimum budget cannot be negative")
      .max(5000, "Minimum budget cannot exceed £5,000"),
    maxBudget: z.coerce
      .number()
      .min(0, "Maximum budget cannot be negative")
      .max(20000, "Maximum budget cannot exceed £20,000"),
  }).refine((data) => data.minBudget < data.maxBudget, {
    message: "Minimum budget must be less than maximum budget",
    path: ["minBudget"],
  });

  const [,setLocation] = useLocation();
  // Set up form with react-hook-form and zod resolver
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brand: "All",
      model: "All",
      variant: "All",
      minBudget: 5000,
      maxBudget: 20000,
    },
  });

  const {setSearch} = useHeroSectionSearch();

  // Form submission handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log("Search with parameters:", data);
    setSearch({...data});
    setLocation('/vehicles')
    // Handle the search logic here
  };

  return (
    <div
      className="relative min-h-[600px] bg-cover bg-center"
      style={{
        backgroundImage:
          'url("https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000")',
        backgroundBlendMode: "overlay",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      }}
    >
      <div className="container mx-auto px-4 py-16">
        {/* Category Pills */}
        <div className="flex gap-2 mb-12">
          <Button
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white rounded-full px-8"
          >
            Cars
          </Button>
          <Button
            variant="secondary"
            className="bg-white/10 hover:bg-white/20 text-white rounded-full px-8"
          >
            Bikes
          </Button>
          <Button
            variant="secondary"
            className="bg-white/10 hover:bg-white/20 text-white rounded-full px-8"
          >
            Vans
          </Button>
        </div>

        {/* Hero Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Discover The Best Vehicles Near You Through An Exceptional
              Classifieds Experience And Exciting Auctions
            </h1>
            <p className="text-lg text-white/80">
              Find your perfect vehicle with ease through classifieds and
              auctions
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <Button
                variant="secondary"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                Live Auction
              </Button>
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white px-8"
              >
                How it works
              </Button>
            </div>
          </div>

          {/* Quick Finder Form */}
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">
              Find your vehicle with quick finder
            </h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-2 gap-4">
                  {/* Brand Select */}
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="h-12 bg-gray-100">
                              <SelectValue placeholder="All Brands" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="All">All Brands</SelectItem>
                              <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                              <SelectItem value="BMW">BMW</SelectItem>
                              <SelectItem value="Audi">Audi</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Model Select */}
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || undefined} 
                            defaultValue={field.value || undefined}
                          >
                            <SelectTrigger className="h-12 bg-gray-100">
                              <SelectValue  placeholder="All Models" />
                            </SelectTrigger>
                            <SelectContent>
                             <SelectItem value="All">All-Models</SelectItem>
                              <SelectItem value="A-Class">A-Class</SelectItem>
                              <SelectItem value="C-Class">C-Class</SelectItem>
                              <SelectItem value="E-Class">E-Class</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Variant Select */}
                  <FormField
                    control={form.control}
                    name="variant"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="h-12 bg-gray-100">
                              <SelectValue placeholder="All Model Variants" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="All">All Model Variants</SelectItem>
                              <SelectItem value="AMG">AMG</SelectItem>
                              <SelectItem value="Sport">Sport</SelectItem>
                              <SelectItem value="SE">SE</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Budget Range Inputs */}
                  <div className="col-span-full">
                    <Label className="text-[14px]">Budget</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="minBudget"
                        render={({ field }) => (
                          <FormItem>
                            <Label className="text-xs text-gray-500">Min</Label>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="5000"
                                className="h-12 bg-gray-100"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="maxBudget"
                        render={({ field }) => (
                          <FormItem>
                            <Label className="text-xs text-gray-500">Max</Label>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="20000"
                                className="h-12 bg-gray-100"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-500" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full mt-6 h-12 bg-blue-600 hover:bg-blue-700 text-white text-lg"
                >
                  Search
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}