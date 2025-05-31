import {
  Search,
  Plus,
  BarChart2,
  Calendar,
  Clock,
  Settings,
  HelpCircle,
  ChevronDown,
  Upload,
  Car,
  Truck,
  Bike,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import VehicleUploadForm from "@/components/seller/vehicle-upload-form";
import { useState } from "react";
import Packages from "@/components/packages";
import VehicleCard from "@/components/vehicle-card";
import PaymentFormWrapper from "@/components/payment-form";

export default function SellerVehicleUpload() {
  const [vehicleData, setVehicleData] = useState<any | null>(null);
  const [paymentData, setPaymentData] = useState<any | null>(null);

  const [stage, setStage] = useState<number>(1);

  function pullData(data: any) {
    setVehicleData(data);
    setStage(2);
    console.log(data);
  }

  return (
    <div className="flex flex-col min-h-screen">
    {/* {
      vehicleData && stage == 2 ? (
        <VehicleCard vehicle={vehicleData} />
      ) : null
    } */}
      <main className="py-8 px-16">
        {stage == 1 && <VehicleUploadForm pullData={pullData} />}
        {stage == 2 && <Packages type="CLASSIFIED" vehiclePrice={100} draftId={vehicleData?.draftId}  pullData={(data)=>{
          setPaymentData(data);
          setStage(3);
        }}/>}
        {
          paymentData && stage == 3 ? (
            <PaymentFormWrapper clientSecret={paymentData.clientSecret} />
          ) : null
        }
      </main>
    </div>
  );
}
