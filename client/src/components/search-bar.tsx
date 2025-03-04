import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function SearchBar() {
  const [, setLocation] = useLocation();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      query: ""
    }
  });

  const onSubmit = (data: { query: string }) => {
    setLocation(`/search?q=${encodeURIComponent(data.query)}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
      <Input
        {...register("query")}
        placeholder="Search cars, vans, bikes..."
        className="flex-1"
      />
      <Button type="submit" variant="secondary">
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </form>
  );
}
