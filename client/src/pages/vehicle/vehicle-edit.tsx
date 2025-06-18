import { Search, Car, CheckCircle, SearchIcon } from "lucide-react";
import VehicleEditForm from "@/components/seller/vehicle-edit-form";
import { useState, useEffect } from "react";
import { getVehicleById } from "@/api";
import { useParams } from "wouter";
import Loader from "@/components/loader";
import { useUser } from "@/hooks/use-store";

export default function VehicleEditPage() {
  const [vehicleData, setVehicleData] = useState<any | null>(null);
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const { userId } = useUser();

  useEffect(() => {
    const fetchVehicle = async () => {
      setIsLoading(true);
      try {
        const response = await getVehicleById(id);
        console.log(response);
        setVehicleData(response);
      } catch (error) {
        console.error("Error fetching vehicle data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicle();
  }, [id]);

  if (isLoading) return <Loader />;

  if (vehicleData && vehicleData.sellerId !== userId)
    return <p>You are not authorized to edit</p>;

  if (vehicleData)
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <main className="py-8 px-16">
          <VehicleEditForm vehicleData={vehicleData} />
        </main>
      </div>
    );
}
