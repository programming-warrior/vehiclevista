import { Loader2 } from "lucide-react";
import react from "react";

export default function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">Loading...</span>
    </div>
  );
}
