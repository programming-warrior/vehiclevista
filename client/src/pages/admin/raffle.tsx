import RaffleForm from "@/components/admin/raffle-create-form";
import AdminLayout from "@/components/admin/admin-layout";
import { getRaffles } from "@/api";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Car, DollarSign, Users, Tag, AlertCircle } from "lucide-react";
import RaffleCountDownTimer from "@/components/rafflecountdown-timer";

export default function AdminRafflePage() {
  const [raffles, setRaffles] = useState<any>([]);
  const [activeTab, setActiveTab] = useState("view");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRaffles() {
      try {
        setLoading(true);
        const data = await getRaffles();
        setRaffles(data);
      } catch (e) {
        console.error("Failed to fetch raffles:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchRaffles();

    // // Refresh data every minute
    // const intervalId = setInterval(fetchRaffles, 60000);
    // return () => clearInterval(intervalId);
  }, []);

  const handleStopRaffle = async (raffleId: number) => {
    // Implementation would depend on your API
    if (confirm("Are you sure you want to stop this raffle?")) {
      try {
        // Replace with actual API call
        // await stopRaffle(raffleId);
        alert("Raffle stopped successfully");
        // Refresh raffles after stopping
        const data = await getRaffles();
        setRaffles(data);
      } catch (e) {
        console.error("Failed to stop raffle:", e);
        alert("Failed to stop raffle");
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-500">Running</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>;
      case "upcoming":
        return <Badge className="bg-yellow-500">Upcoming</Badge>;
      case "stopped":
        return <Badge className="bg-red-500">Stopped</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Raffle Management</h1>

        <Tabs
          defaultValue="view"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="view">View Raffles</TabsTrigger>
            <TabsTrigger value="create">Create Raffle</TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : raffles.length === 0 ? (
              <div className="text-center p-12 border rounded-lg bg-gray-50">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No raffles found</h3>
                <p className="text-gray-500 mt-2">
                  Create your first raffle to get started.
                </p>
                <Button className="mt-4" onClick={() => setActiveTab("create")}>
                  Create Raffle
                </Button>
              </div>
            ) : (
              <>
                {/* Running Raffles Section */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-green-500" />
                    Running Raffles
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {raffles
                      .filter((raffle: any) => raffle.status === "running")
                      .map((raffle: any, idx:number) => (
                        <Card
                          key={raffle.id}
                          className="overflow-hidden border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">
                                  {raffle.title}
                                </CardTitle>
                                <CardDescription className="flex items-center mt-1">
                                  <Car className="h-4 w-4 mr-1" />
                                  {raffle.year} {raffle.make} {raffle.model}
                                </CardDescription>
                              </div>
                              {getStatusBadge(raffle.status)}
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                                <span>{raffle.ticketPrice}/ticket</span>
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1 text-gray-500" />
                                <span>{raffle.leads || 0} entries</span>
                              </div>
                              <div className="col-span-2 mt-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500">
                                    Time remaining:
                                  </span>
                                  <RaffleCountDownTimer
                                    raffle={raffle}
                                    setRaffle={(updater: any) =>
                                      setRaffles((prev:any) =>
                                        prev.map((a, i) =>
                                          i === idx
                                            ? typeof updater === "function"
                                              ? updater(a)
                                              : updater
                                            : a
                                        )
                                      )
                                    }
                                  />
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                  <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        ((raffle.leads || 0) /
                                          raffle.ticketQuantity) *
                                          100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                                <div className="flex justify-between text-xs mt-1">
                                  <span>{raffle.leads || 0} sold</span>
                                  <span>{raffle.ticketQuantity} total</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="pt-2 flex justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(`/raffles/${raffle.id}`, "_blank")
                              }
                            >
                              View Details
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleStopRaffle(raffle.id)}
                            >
                              Stop Raffle
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    {!raffles.some(
                      (raffle: any) => raffle.status === "running"
                    ) && (
                      <div className="col-span-full text-center p-8 border rounded-lg bg-gray-50">
                        <p className="text-gray-500">
                          No running raffles at the moment
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Other Raffles Section */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Other Raffles</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left p-3">Title</th>
                          <th className="text-left p-3">Vehicle</th>
                          <th className="text-left p-3">Status</th>
                          <th className="text-left p-3">Ticket Price</th>
                          <th className="text-left p-3">Tickets Sold</th>
                          <th className="text-left p-3">Date Range</th>
                          <th className="text-center p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {raffles
                          .filter((raffle: any) => raffle.status !== "running")
                          .map((raffle: any) => (
                            <tr
                              key={raffle.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="p-3">{raffle.title}</td>
                              <td className="p-3">
                                {raffle.year} {raffle.make} {raffle.model}
                              </td>
                              <td className="p-3">
                                {getStatusBadge(raffle.status)}
                              </td>
                              <td className="p-3">₹{raffle.ticketPrice}</td>
                              <td className="p-3">
                                {raffle.leads || 0}/{raffle.ticketQuantity}
                              </td>
                              <td className="p-3 text-xs">
                                {formatDate(raffle.startDate)}
                                <br />
                                to
                                <br />
                                {formatDate(raffle.endDate)}
                              </td>
                              <td className="p-3 text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mr-2"
                                  onClick={() =>
                                    window.open(
                                      `/raffles/${raffle.id}`,
                                      "_blank"
                                    )
                                  }
                                >
                                  View
                                </Button>
                                {raffle.status === "upcoming" && (
                                  <Button size="sm" variant="default">
                                    Start
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        {!raffles.some(
                          (raffle: any) => raffle.status !== "running"
                        ) && (
                          <tr>
                            <td
                              colSpan={7}
                              className="p-8 text-center text-gray-500"
                            >
                              No other raffles available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New Raffle</CardTitle>
                <CardDescription>
                  Set up a new vehicle raffle with all the necessary details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RaffleForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
