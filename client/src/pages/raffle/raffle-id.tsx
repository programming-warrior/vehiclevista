import React, { useEffect, useState } from "react";
import { useParams } from "wouter";
import {
  Heart,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Clock,
  Tag,
  Users,
  DollarSign,
  Info,
  Calendar,
  Gauge,
  Palette,
  Ticket,
  Trophy,
} from "lucide-react";
import { getRunningRaffle, purchaseRaffleTicket, incrementVehicleViews } from "@/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ImageGallery from "@/components/image-gallery";
import { Button } from "@/components/ui/button";
import RaffleCountDownTimer from "@/components/rafflecountdown-timer";
import { useUser } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.bubble.css";
import ReportDialog from "@/components/ui/report-dialog";
import { incrementRaffleViews } from "@/api/raffle-api";

export default function RaffleIdPage() {
  const { id } = useParams<{ id: string }>();
  const [raffle, setRaffle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [purchaseError, setPurchaseError] = useState("");
  const { userId, role, card_verified } = useUser();
  const { toast } = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [entries, setEntries] = useState<any>([]);

  // Total cost calculation
  const totalCost = raffle?.ticketPrice ? raffle.ticketPrice * ticketQuantity : 0;
  const ticketsLeft = raffle ? raffle.ticketQuantity - (raffle.soldTicket || 0) : 0;
  const progressPercentage = raffle ? Math.min(100, ((raffle.soldTicket ) / raffle.ticketQuantity) * 100) : 0;


  function handleQuantityInput(e: React.ChangeEvent<HTMLInputElement>) {
    const value: number = parseInt(e.target.value);
    setTicketQuantity(value);

    if (isNaN(value) || value < 1) {
      setPurchaseError("Please enter a valid quantity (minimum 1 ticket).");
    } else if (value > ticketsLeft) {
      setPurchaseError(`Only ${ticketsLeft} tickets left available.`);
    } else {
      setPurchaseError("");
    }
  }

  async function handlePurchaseTickets() {
    if (id && !purchaseError && ticketQuantity > 0) {
      try {
        if (!userId) {
          toast({
            variant: "destructive",
            title: "Login Required",
            description: "You need to be logged in before purchasing tickets",
          });
        } else if (!card_verified) {
          toast({
            variant: "destructive",
            title: "No Card Found",
            description: "You need to validate your card before purchasing tickets",
          });
        } else {
          const result = await purchaseRaffleTicket(id, ticketQuantity.toString());
          toast({
            title: "Request Added",
            description: `Your ticket purchase request has been added.`,
          });
          
          // Refresh raffle data
          const updatedRaffle = await getRunningRaffle();
          setRaffle(updatedRaffle);
          
          // Refresh entries
        //   const updatedEntries = await getEntriesForRaffle(id);
        //   setEntries(updatedEntries.entries);
        }
      } catch (e:any) {
        toast({
          variant: "destructive",
          title: "Purchase Failed",
          description: e.message || "Something went wrong",
        });
      } finally {
        setPurchaseOpen(false);
        setTicketQuantity(1);
      }
    }
  }

  useEffect(() => {
    const fetchRaffle = async () => {
      setLoading(true);
      try {
        const response = await getRunningRaffle();
        setRaffle(response);
      } catch (error) {
        console.error("Error fetching raffle:", error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchRaffleEntries = async () => {
      try {
        // const response = await getEntriesForRaffle(id);
        // setEntries(response.entries);
      } catch (error) {
        console.error("Error fetching entries:", error);
      }
    };

    fetchRaffleEntries();
    fetchRaffle();
    incrementRaffleViews(id)
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-xl font-medium">Loading raffle details...</div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="container mx-auto p-8 text-center min-h-[50vh]">
        <div className="text-xl font-medium">Raffle not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 bg-blue-50">
      {!raffle ? (
        <div className="text-center py-16">Raffle not found</div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Raffle Status Bar */}
          <div className="bg-blue-800 text-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-sm uppercase tracking-wide">
                    Ticket Price
                  </span>
                  <span className="text-2xl font-bold flex items-center">
                    <DollarSign size={20} className="mr-1" />
                    {raffle.ticketPrice}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm uppercase tracking-wide">
                    Time Left
                  </span>
                  <span className="text-2xl font-medium flex items-center">
                    <Clock size={20} className="mr-1" />
                    <RaffleCountDownTimer raffle={raffle} setRaffle={setRaffle} />
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm uppercase tracking-wide">
                    Total Entries
                  </span>
                  <span className="text-2xl font-medium flex items-center">
                    <Users size={20} className="mr-1" />
                    {raffle.leads || 0}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setPurchaseOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-md"
              >
                Buy Tickets
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-blue-800">
                {raffle.title}
              </h1>
              <div className="flex items-center gap-2 text-blue-600">
                <MapPin size={16} />
                <span>{raffle.location || "Location not specified"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column - Gallery */}
              <div className="lg:col-span-2">
                {raffle.images && raffle.images.length > 0 ? (
                  <ImageGallery images={raffle.images} />
                ) : (
                  <div className="aspect-[4/3] bg-gray-200 flex items-center justify-center rounded-md mb-6">
                    <p>No images available</p>
                  </div>
                )}

                {/* Description with ReactQuill */}
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4 flex items-center text-blue-800">
                    <Info size={20} className="mr-2" />
                    Description
                  </h2>
                  <div className="border border-blue-100 rounded-md p-4 bg-blue-50">
                    <ReactQuill
                      value={raffle.description || "No description available."}
                      readOnly={true}
                      theme="bubble"
                    />
                  </div>
                </div>
                
                {/* Raffle Progress */}
                <div className="mt-8 border border-blue-100 rounded-md p-6 bg-white">
                  <h2 className="text-xl font-bold mb-4 text-blue-800">Raffle Progress</h2>
                  
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-blue-700">Tickets Sold: {raffle.soldTicket}</span>
                      <span className="font-medium text-blue-700">{raffle.ticketQuantity} Total Tickets</span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-4">
                      <div 
                        className="bg-blue-500 h-4 rounded-full" 
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-blue-600">{progressPercentage.toFixed(1)}% Complete</span>
                      <span className="text-xs text-blue-600">{ticketsLeft} Tickets Left</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex items-center bg-blue-50 p-4 rounded-lg flex-grow">
                      <Ticket className="text-blue-600 mr-3 h-8 w-8" />
                      <div>
                        <div className="text-sm text-blue-600">Ticket Price</div>
                        <div className="font-bold text-xl text-blue-800">${raffle.ticketPrice}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center bg-blue-50 p-4 rounded-lg flex-grow">
                      <Trophy className="text-blue-600 mr-3 h-8 w-8" />
                      <div>
                        <div className="text-sm text-blue-600">Draw Date</div>
                        <div className="font-bold text-blue-800">
                          {new Date(raffle.endDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column - Vehicle details & Entry history */}
              <div className="lg:col-span-1 space-y-6">
                {/* Vehicle details card */}
                <div className="bg-white border border-blue-100 rounded-lg p-5 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 border-b border-blue-100 pb-2 text-blue-800">
                    Vehicle Details
                  </h2>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-blue-700">
                        <Tag size={18} className="mr-2" />
                        <span>Make</span>
                      </div>
                      <span className="font-medium">
                        {raffle.make || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-blue-700">
                        <Tag size={18} className="mr-2" />
                        <span>Model</span>
                      </div>
                      <span className="font-medium">
                        {raffle.model || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-blue-700">
                        <Calendar size={18} className="mr-2" />
                        <span>Year</span>
                      </div>
                      <span className="font-medium">
                        {raffle.year || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-blue-700">
                        <Gauge size={18} className="mr-2" />
                        <span>Mileage</span>
                      </div>
                      <span className="font-medium">
                        {raffle.mileage || "N/A"} km
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-blue-700">
                        <Palette size={18} className="mr-2" />
                        <span>Color</span>
                      </div>
                      <span className="font-medium">
                        {raffle.color || "N/A"}
                      </span>
                    </div>
                  </div>
                  
                  {/* <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-bold text-blue-800 mb-2">Prize Value</h3>
                    <div className="text-2xl font-bold text-blue-800">${raffle.value || 'N/A'}</div>
                  </div>
                   */}
                  <Button
                    variant="outline"
                    className="mt-4 w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                    size="lg"
                    onClick={() => setPurchaseOpen(true)}
                  >
                    <Ticket className="h-4 w-4 mr-2" />
                    Buy Tickets Now
                  </Button>
                  
                  {/* <Button
                    variant="destructive"
                    className="mt-2 w-full"
                    size="sm"
                    onClick={() => setReportOpen(true)}
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Report Raffle
                  </Button> */}
                </div>

                {/* Entry history card */}
                <div className="bg-white border border-blue-100 rounded-lg p-5 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 border-b border-blue-100 pb-2 flex items-center text-blue-800">
                    <Users size={20} className="mr-2" />
                    Recent Entries
                  </h2>

                  <div className="max-h-80 overflow-y-auto">
                    {entries.length === 0 ? (
                      <div className="text-center py-6 text-blue-500">
                        No entries yet. Be the first!
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-blue-600">
                            <th className="pb-2">User</th>
                            <th className="pb-2">Tickets</th>
                            <th className="pb-2">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((entry:any, idx:number) => (
                            <tr key={idx} className="border-t border-blue-100">
                              <td className="py-2 font-medium">
                                {entry.user.username}
                              </td>
                              <td className="py-2">{entry.ticketCount}</td>
                              <td className="py-2 text-blue-500">
                                {new Date(entry.createdAt).toLocaleString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
                
                {/* Rules card */}
                <div className="bg-white border border-blue-100 rounded-lg p-5 shadow-sm">
                  <h2 className="text-xl font-bold mb-4 border-b border-blue-100 pb-2 flex items-center text-blue-800">
                    <Info size={20} className="mr-2" />
                    Raffle Rules
                  </h2>
                  
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-xs mt-0.5">1</div>
                      <span>Purchase tickets to enter the raffle</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-xs mt-0.5">2</div>
                      <span>Each ticket gives you one entry in the drawing</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-xs mt-0.5">3</div>
                      <span>Winner will be randomly selected when the timer ends</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-xs mt-0.5">4</div>
                      <span>Winner will be notified via email and phone</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-xs mt-0.5">5</div>
                      <span>The more tickets you purchase, the higher your chances of winning</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-blue-800">Purchase Raffle Tickets</DialogTitle>
            <DialogDescription>
              Select how many tickets you'd like to purchase for this raffle.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
            <div className="space-y-4">
              <div className="rounded-md overflow-hidden">
                <img
                  src={raffle.images?.[0]}
                  alt="Prize"
                  className="w-full aspect-video object-cover"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-md space-y-3">
                <div className="flex items-center">
                  <DollarSign size={18} className="mr-2 text-blue-600" />
                  <span className="font-semibold">Ticket Price:</span>
                  <span className="ml-2">${raffle.ticketPrice}</span>
                </div>

                <div className="flex items-center">
                  <Users size={18} className="mr-2 text-blue-600" />
                  <span className="font-semibold">Available Tickets:</span>
                  <span className="ml-2">{ticketsLeft} of {raffle.ticketQuantity}</span>
                </div>

                <div className="flex items-center">
                  <Clock size={18} className="mr-2 text-blue-600" />
                  <span className="font-semibold">Time Left:</span>
                  <span className="ml-2">
                    <RaffleCountDownTimer raffle={raffle} setRaffle={setRaffle} />
                  </span>
                </div>
              </div>

              <div className="p-4 border rounded-md">
                <div className="font-semibold mb-2">Enter Number of Tickets</div>
                <input
                  type="number"
                  className={`w-full border rounded-md px-3 py-2 ${
                    purchaseError ? "border-red-500 bg-red-50" : "border-blue-300"
                  }`}
                  placeholder="How many tickets?"
                  value={ticketQuantity}
                  min="1"
                  max={ticketsLeft}
                  onChange={handleQuantityInput}
                />
                {purchaseError && (
                  <div className="text-red-500 text-xs mt-1">{purchaseError}</div>
                )}

                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <div className="flex justify-between">
                    <span>Cost per ticket:</span>
                    <span>${raffle.ticketPrice}</span>
                  </div>
                  <div className="flex justify-between font-bold text-blue-800 text-lg mt-2">
                    <span>Total cost:</span>
                    <span>${totalCost.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!!purchaseError || ticketQuantity < 1}
                  onClick={handlePurchaseTickets}
                >
                  Purchase Tickets
                </Button>
              </div>
            </div>

            <div>
              <div className="mb-3 font-semibold flex items-center">
                <Users size={18} className="mr-2" />
                Prize Details
              </div>

              <div className="border rounded-md p-4 bg-white h-[400px] overflow-y-auto">
                <h3 className="font-bold text-lg text-blue-800 mb-3">{raffle.title}</h3>
                
                <div className="space-y-4">
                  <p className="text-sm text-blue-700">
                    {raffle.year} {raffle.make} {raffle.model}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold block">Year:</span>
                      <span>{raffle.year}</span>
                    </div>
                    <div>
                      <span className="font-semibold block">Make:</span>
                      <span>{raffle.make}</span>
                    </div>
                    <div>
                      <span className="font-semibold block">Model:</span>
                      <span>{raffle.model}</span>
                    </div>
                    <div>
                      <span className="font-semibold block">Color:</span>
                      <span>{raffle.color}</span>
                    </div>
                    {raffle.mileage && (
                      <div>
                        <span className="font-semibold block">Mileage:</span>
                        <span>{raffle.mileage} km</span>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold block">Value:</span>
                      <span>${raffle.value}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-blue-100 pt-4 mt-4">
                    <h4 className="font-semibold mb-2">Your Chances:</h4>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="flex justify-between text-sm">
                        <span>With {ticketQuantity} ticket{ticketQuantity > 1 ? 's' : ''}:</span>
                        <span className="font-semibold">
                          1 in {Math.round(raffle.ticketQuantity / ticketQuantity)} chance
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Buy more tickets to increase your chances of winning!
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-blue-100 pt-4">
                    <h4 className="font-semibold mb-2">Drawing Date:</h4>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                      {new Date(raffle.endDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ReportDialog
        isOpen={reportOpen}
        onOpenChange={setReportOpen}
        type="raffle"
        targetId={id}
      />
    </div>
  );
}