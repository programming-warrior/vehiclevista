import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, DollarSign, Users, Clock, ArrowRight, Trophy, PoundSterling } from "lucide-react";
import { getRunningRaffle } from "@/api";
import RaffleCountDownTimer from "./rafflecountdown-timer";
import { useLocation } from "wouter";

export default function RaffleHomeSection() {
  const [raffle, setRaffle] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [location,setLocation] = useLocation();

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await getRunningRaffle();
        setRaffle(data);
      } catch (err) {
        console.error("Failed to load raffles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12 animate-pulse w-full">
        <div className="h-6 w-32 bg-blue-100 rounded mx-auto mb-4"></div>
        <div className="h-64 w-full bg-blue-50 rounded-lg"></div>
      </div>
    );
  }

  if (!raffle) {
    return <div className=""></div>;
  }

  const progressPercentage = Math.min(
    100,
    (raffle.soldTicket / raffle.ticketQuantity) * 100
  );

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        Featured Raffle
      </h2>
      <Card
        key={raffle.id}
        className="flex flex-col md:flex-row overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white w-full border-t-4 border-t-blue-500"
      >
        <div className="w-full md:w-2/5 lg:w-1/3 relative bg-blue-50 flex items-center justify-center p-4">
          <div className="relative w-full h-64 md:h-80">
            <img
              className="w-full h-full object-contain"
              src={raffle?.images && raffle.images[0]}
              alt={`${raffle.year} ${raffle.make} ${raffle.model}`}
            />
          </div>
          <Badge className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 text-sm font-medium">
            LIVE
          </Badge>
        </div>
        
        <div className="w-full md:w-3/5 lg:w-2/3 flex flex-col justify-between">
          <div>
            <CardHeader className="pb-2">
              <div className="space-y-1">
                <CardTitle className="text-2xl text-blue-800">{raffle.title}</CardTitle>
                <CardDescription className="font-medium text-blue-600 text-lg">
                  {raffle.year} {raffle.make} {raffle.model}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <PoundSterling className="h-6 w-6 mr-2 text-blue-600" />
                  <div>
                    <span className="font-bold text-xl text-blue-800">{raffle.ticketPrice}</span>
                    <span className="text-sm text-blue-600 ml-1">per ticket</span>
                  </div>
                </div>
                {/* <div className="flex items-center">
                  <Users className="h-6 w-6 mr-2 text-blue-600" />
                  <div>
                    <span className="font-bold text-xl text-blue-800">{raffle.leads || 0}</span>
                    <span className="text-sm text-blue-600 ml-1">entries</span>
                  </div>
                </div> */}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">Time remaining:</span>
                  <div className="text-blue-800 font-bold text-lg px-3 py-1 bg-blue-50 rounded-full">
                    <RaffleCountDownTimer raffle={raffle} setRaffle={setRaffle} />
                  </div>
                </div>

                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-blue-700">
                        {progressPercentage.toFixed(0)}% Sold
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-700">
                        {raffle.soldTicket}/{raffle.ticketQuantity} tickets
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-3 text-xs flex rounded-full bg-blue-100">
                    <div
                      style={{ width: `${progressPercentage}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 rounded-full"
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>

          <CardFooter className="pt-2 pb-6 px-6">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 py-6 text-lg rounded-lg"
              onClick={() => setLocation(`/raffle`)}
            >
              Enter Raffle Now <ArrowRight className="h-5 w-5" />
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}