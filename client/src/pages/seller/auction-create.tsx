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
  CheckCircle,
  Circle,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AuctionUploadForm from "@/components/seller/auction-upload-form";
import VehicleUploadForm from "@/components/seller/vehicle-upload-form";
import { useState } from "react";
import Packages from "@/components/packages";
import PaymentFormWrapper from "@/components/payment-form";
import FindVehicleCard from "@/components/find-vehicle";
import NumberPlateForm from "@/components/numberplate-create-form";
import { verifyPayment } from "@/api";
import { useEffect } from "react";
import { useUser } from "@/hooks/use-store";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuctionDraftCache } from "@/hooks/use-store";

export default function SellerAuctionUpload() {
  const [auctionData, setAuctionData] = useState<any | null>(null);
  const [preVehicleData, setPreVehicleData] = useState<any | null>(null);
  const [itemData, setItemData] = useState<any | null>(null);
  const [paymentData, setPaymentData] = useState<any | null>(null);
  const [numberplateData, setNumberplateData] = useState<any | null>(null);
  const { userId } = useUser();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { auctionCache } = useAuctionDraftCache();

  const [stage, setStage] = useState<number>(1);

  const stages = [
    { id: 1, name: "Auction Details", icon: Calendar },
    { id: 2, name: "Item Details", icon: Car },
    { id: 3, name: "Package", icon: CheckCircle },
    { id: 4, name: "Payment", icon: CheckCircle },
  ];

  const getProgressPercentage = () => {
    return ((stage - 1) / (stages.length - 1)) * 100;
  };

  //fetch the auctionData from localcache
  useEffect(() => {
    console.log(auctionCache);
    if (auctionCache.draftId && auctionCache.item.draftId) {
      setAuctionData(auctionCache);
      setItemData(auctionCache.item);
      setStage(3);
    } else if (auctionCache.draftId) {
      setAuctionData(auctionCache);
      setStage(2);
    }
  }, []);

  useEffect(() => {
    //before the payment page is opened check if the user is logged in if not redirect to login
    if (stage === 4) {
      if (!userId) {
        // toast({
        //   variant: "destructive",
        //   description: "You are not logged in",
        // });
        // setLocation('/login');
      }
    }
  }, [stage]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Create Auction</h1>
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

      <main className="flex-1 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Stage 1: Auction Form */}
          {stage === 1 && (
            <AuctionUploadForm
              pullData={(data) => {
                setAuctionData(data);
                setStage(2);
              }}
            />
          )}

          {stage === 2 && auctionData && (
            <div>
              {auctionData.itemType === "VEHICLE" &&
                (!preVehicleData ? (
                  <FindVehicleCard
                    pullData={(data) => {
                      setPreVehicleData(data);
                    }}
                  />
                ) : (
                  <VehicleUploadForm
                    prefetchedData={preVehicleData}
                    auctionDraftId={auctionData.draftId}
                    pullData={(data) => {
                      setItemData(data);
                      setStage(3);
                    }}
                  />
                ))}

              {auctionData.itemType === "NUMBERPLATE" && (
                <NumberPlateForm
                  auctionDraftId={auctionData.draftId}
                  pullData={(data) => {
                    console.log(data);
                    console.log(auctionData);
                    setItemData(data);
                    setStage(3);
                  }}
                />
              )}
            </div>
          )}

          {stage === 3 && auctionData && itemData && (
            <Packages
              type={
                auctionData.itemType === "VEHICLE"
                  ? "AUCTION-VEHICLE"
                  : "AUCTION-NUMBERPLATE"
              }
              itemPrice={
                auctionData.itemType === "NUMBERPLATE"
                  ? itemData.plate_value
                  : itemData.price
              }
              draftId={auctionData.draftId}
              pullData={(data) => {
                setStage(4);
                setPaymentData(data);
              }}
              setStage={setStage}
            />
          )}

          {paymentData && stage === 4 && (
            <div className="mt-8">
              <PaymentFormWrapper
                verifyPayment={verifyPayment}
                clientSecret={paymentData.clientSecret}
              />
            </div>
          )}

          {/* Navigation */}
          {/* {stage > 1 && (
            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStage(stage - 1)}
                className="flex items-center gap-2"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
                Back
              </Button>
              <div></div>
            </div>
          )} */}
        </div>
      </main>
    </div>
  );
}
