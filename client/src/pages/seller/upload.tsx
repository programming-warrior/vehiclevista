import { Search, Car, CheckCircle, SearchIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import VehicleUploadForm from "@/components/seller/vehicle-upload-form";
import { useState } from "react";
import Packages from "@/components/packages";
import VehicleCard from "@/components/vehicle-card";
import PaymentFormWrapper from "@/components/payment-form";
import FindVehicleCard from "@/components/find-vehicle";
import { verifyPayment } from "@/api";

export default function SellerVehicleUpload() {
  const [vehicleData, setVehicleData] = useState<any | null>(null);
  const [preVehicleData, setPreVehicleData] = useState<any | null>(null);
  const [paymentData, setPaymentData] = useState<any | null>(null);
  const [stage, setStage] = useState<number>(1);
  const stages = [
    { id: 1, name: "Find your vehicle", icon: SearchIcon },
    { id: 2, name: "Vehicle Details", icon: Car },
    { id: 3, name: "Package", icon: CheckCircle },
    { id: 4, name: "Payment", icon: CheckCircle },
  ];

  const getProgressPercentage = () => {
    return ((stage - 1) / (stages.length - 1)) * 100;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 ">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Create Classified Listing
            </h1>
            <div className="text-sm text-gray-500">
              Step {stage} of {stages.length}
            </div>
          </div>

          <div className="relative">
            <Progress
              value={getProgressPercentage()}
              className="h-2 bg-gray-200"
            />
            <div className="flex justify-between mt-3">
              {stages.map((stageItem, index) => {
                const StageIcon = stageItem.icon;
                const isCompleted = stage > stageItem.id;
                const isCurrent = stage === stageItem.id;
                
                return (
                  <div
                    key={stageItem.id}
                    className="flex flex-col items-center"
                  >
                    <div
                      className={`
                              w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors
                              ${
                                isCompleted
                                  ? "bg-green-500 text-white"
                                  : isCurrent
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-300 text-gray-600"
                              }
                            `}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <StageIcon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={`
                              text-xs font-medium text-center
                              ${isCurrent ? "text-blue-600" : "text-gray-500"}
                            `}
                    >
                      {stageItem.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <main className="py-8 px-16">
        {stage == 1 && (
          <FindVehicleCard
            pullData={(data: any) => {
              setPreVehicleData(data);
              setStage(2);
            }}
          />
        )}
        {stage == 2 && (
          <VehicleUploadForm
            prefetchedData={preVehicleData}
            pullData={(data: any) => {
              setVehicleData(data);
              setStage(3);
            }}
          />
        )}

        {stage == 3 && (
          <Packages
            type="CLASSIFIED"
            itemPrice={vehicleData?.price}
            draftId={vehicleData?.draftId}
            pullData={(data) => {
              setPaymentData(data);
              setStage(4);
            }}
          />
        )}
        {paymentData && stage == 4 ? (
          <PaymentFormWrapper verifyPayment={verifyPayment} clientSecret={paymentData.clientSecret} />
        ) : null}
      </main>
    </div>
  );
}
