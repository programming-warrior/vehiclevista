import react from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuickSearch } from "@/hooks/use-store";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Button } from "./button";
import { Label } from "./label";
import { DISTANCES, ALL_MAKE, MAKE_MODEL_MAP } from "@/lib/constants";
import { vehicleTypes } from "@shared/schema";
import { vehicleTransmissionsTypes } from "@shared/zodSchema/vehicleSchema";
import { fetchVehicleCount, validatePostalCode } from "@/api";
import { Loader2 } from "lucide-react";


const QuickVehicleSearch = () => {

    const formSchema = z
        .object({
            postalCode: z.string().min(1, "Postal code is required"),
            distance: z.string().min(1, "Distance is required"),
            make: z.string(),
            model: z.string(),
            minBudget: z.coerce.number(),
            maxBudget: z.coerce.number(),
            latitude: z.string().optional(),
            longitude: z.string().optional(),
        })
        .refine((data) => data.maxBudget > 0 && data.minBudget > 0, {
            message: "Both minimum and maximum budget must be greater than zero",
            path: ["minBudget"],
        })
        .refine((data) => data.maxBudget >= data.minBudget, {
            message: "Maximum budget must get greater than minimum budget",
            path: ["maxBudget"],
        });

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            postalCode: "",
            distance: "National",
            make: "",
            model: "",
            minBudget: 0,
            maxBudget: 0,
            latitude: "",
            longitude: "",
        },
    });

    const [, setLocation] = useLocation();
    const [isLoading, setisLoading] = useState(false);
    const [countData, setCountData] = useState("");
    const [error, setError] = useState("");
    const [canDo, setCanDo] = useState(false);
    const { setFilter } = useQuickSearch();


    useEffect(() => {
        setCanDo(true)
    }, [])


    const onSubmit = (data: z.infer<typeof formSchema>) => {
        setFilter({ ...data as any });
        setLocation("/classified");
    };


    useEffect(() => {
        async function fetch() {
            try {
                setisLoading(true);
                // const res = await fetchVehicleCount({
                //     type: form.watch("type"),
                //     latitude: form.watch("latitude"),
                //     longitude: form.watch("longitude"),
                //     distance: form.watch("distance"),
                //     make: form.watch("make"),
                //     model: form.watch("model"),
                //     maxBudget: form.watch("maxBudget"),
                //     minBudget: form.watch("minBudget"),
                //     transmissionType: form.watch("transmissionType"),
                // });
                // setCountData(res.data.count);
                setError("");
            } catch (e) {
                console.log("before setting error");
                setError("Something went wrong");
            } finally {
                setisLoading(false);
            }
        }

        if (canDo) {
            fetch();
        }
        return () => { };
    }, [
        form.watch("latitude"),
        form.watch("longitude"),
        form.watch("make"),
        form.watch("model"),
        form.watch("distance"),
        form.watch("maxBudget"),
        form.watch("minBudget"),
    ]);

    console.log(form.getValues("postalCode"));

    const debouncedPostalCode = useDebounce(form.getValues("postalCode"));

    console.log("debounced postal value" + debouncedPostalCode);

    useEffect(() => {
        async function fetch() {
            try {
                if (!debouncedPostalCode) return;
                const res = await validatePostalCode(debouncedPostalCode);
                form.setValue("latitude", res.data.result.latitude.toLocaleString());
                form.setValue("longitude", res.data.result.longitude.toLocaleString());
                form.clearErrors("postalCode");
            } catch (e) {
                console.log("before setting error");
                form.setError("postalCode", {
                    type: "manual",
                    message: "Invalid UK postal code",
                });
            }
        }
        fetch();
    }, [debouncedPostalCode]);



    return (
        <div className="bg-white rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">
                Find your vehicle with quick finder
            </h2>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, (e) => console.log(e))}>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Postal Code"
                                            className="pl-10 border-blue-200 focus:ring-blue-500"
                                            value={field.value}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                field.onChange(value);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs text-red-500" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="distance"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Select
                                            value={field.value}
                                            disabled={!form.getValues("longitude")}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                                                <SelectValue
                                                    placeholder="Make"
                                                    className="bg-white border-blue-200 focus:ring-blue-500"
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {/* <SelectItem value="All">All</SelectItem> */}
                                                {DISTANCES.map((m) => {
                                                    return <SelectItem value={m}>{m}</SelectItem>;
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage className="text-xs text-red-500" />
                                </FormItem>
                            )}
                        />
                        {/* make Select */}
                        <FormField
                            control={form.control}
                            name="make"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                                                <SelectValue
                                                    placeholder="Make"
                                                    className="bg-white border-blue-200 focus:ring-blue-500"
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All</SelectItem>
                                                {ALL_MAKE.map((m) => {
                                                    return <SelectItem value={m}>{m}</SelectItem>;
                                                })}
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
                                            value={field.value}
                                            disabled={!form.getValues("make")}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                                                <SelectValue placeholder="Model" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                <SelectItem value="All">All</SelectItem>
                                                {MAKE_MODEL_MAP[form.getValues("make")]?.length >
                                                    0 &&
                                                    MAKE_MODEL_MAP[
                                                        form.getValues("make") as string
                                                    ].map((m) => {
                                                        return <SelectItem value={m}>{m}</SelectItem>;
                                                    })}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Variant Select */}
                        {/* <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                                                <SelectValue
                                                    placeholder="Vehicle Type"
                                                    className="bg-white border-blue-200 focus:ring-blue-500"
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">Any</SelectItem>
                                                {vehicleTypes.map((m) => {
                                                    return (
                                                        <SelectItem value={m}>
                                                            {m
                                                                .split("")
                                                                .map((ch, i) =>
                                                                    i == 0 ? ch.toUpperCase() : ch
                                                                )
                                                                .join("")}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        /> */}

                        {/* <FormField
                            control={form.control}
                            name="transmissionType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <SelectTrigger className="border-blue-200 focus:ring-blue-500 focus:border-blue-500">
                                                <SelectValue placeholder="Select transmission type" />
                                            </SelectTrigger>
                                            <SelectContent className="border-blue-200">
                                                <SelectItem value="All">All</SelectItem>
                                                {form.getValues("type") &&
                                                    vehicleTransmissionsTypes[
                                                    form.getValues(
                                                        "type"
                                                    ) as keyof typeof vehicleTransmissionsTypes
                                                    ] &&
                                                    vehicleTransmissionsTypes[
                                                        form.getValues(
                                                            "type"
                                                        ) as keyof typeof vehicleTransmissionsTypes
                                                    ].map((transmission: string) => (
                                                        <SelectItem
                                                            key={transmission}
                                                            value={transmission}
                                                        >
                                                            {transmission}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        /> */}

                        {/* Budget Range Inputs */}
                        <div className="col-span-full">
                            {/* <Label className="text-[14px]">Budget</Label> */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="minBudget"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label className="text-xs text-gray-500">Min</Label>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9,]*"
                                                    placeholder="Min"
                                                    className="pl-10 border-blue-200 focus:ring-blue-500"
                                                    value={
                                                        field.value > 0
                                                            ? field.value.toLocaleString()
                                                            : ""
                                                    }
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value
                                                            .replace(/,/g, "")
                                                            .replace(/\D/g, "");
                                                        const numValue = Number(rawValue);
                                                        field.onChange(numValue);
                                                    }}
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
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9,]*"
                                                    placeholder="Max"
                                                    className="pl-10 border-blue-200 focus:ring-blue-500"
                                                    value={
                                                        field.value > 0
                                                            ? field.value.toLocaleString()
                                                            : ""
                                                    }
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value
                                                            .replace(/,/g, "")
                                                            .replace(/\D/g, "");
                                                        const numValue = Number(rawValue);
                                                        field.onChange(numValue);
                                                    }}
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
                        {error ? `something went wrong` : ""}
                        {isLoading && (
                            <Loader2 className="animate-spin" />
                        )}
                        {countData ? `Found ${countData} vehicles` : "Search"}

                    </Button>
                </form>
            </Form>
        </div>
    )

}
export default QuickVehicleSearch;
