import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Eye, Ban, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Car, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
// import { getListingReports, resolveReport, deleteReport, banUser } from "@/api";
import { getListingReports } from "@/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function ListingReportManagement() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  const fetchReports = async (page = 1, filter = activeTab) => {
    setLoading(true);
    try {
      const response = await getListingReports({ 
        page, 
        limit: 6,
        filter: filter !== "all" ? filter : undefined 
      });
      
      // Process the reports to ensure all expected fields are available
      const processedReports = response.reports.map((report:any) => {
        // Ensure the image_url exists in auction by getting it from the vehicle if available
        if (report.reportedAuction && report.reportedAuction.vehicle && !report.reportedAuction.image_url) {
          report.reportedAuction.image_url = report.reportedAuction.vehicle.image_url || null;
        }
        return report;
      });
      
      setReports(processedReports);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        variant: "destructive",
        title: "Failed to fetch reports",
        description: "There was an error fetching the reports. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  const handleViewReport = (report:any) => {
    setSelectedReport(report);
    setIsViewDialogOpen(true);
  };

  const handleResolveReport = async (reportId:any) => {
    try {
      // await resolveReport(reportId);
      toast({
        title: "Report resolved",
        description: "The report has been successfully resolved.",
      });
      setIsViewDialogOpen(false);
      fetchReports(currentPage);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: "Failed to resolve the report. Please try again.",
      });
    }
  };

  const handleDeleteReport = async (reportId:any) => {
    try {
      // await deleteReport(reportId);
      toast({
        title: "Report deleted",
        description: "The report has been successfully deleted.",
      });
      setIsViewDialogOpen(false);
      fetchReports(currentPage);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: "Failed to delete the report. Please try again.",
      });
    }
  };

  const handleBanUser = async (userId:any) => {
    try {
      // await banUser(userId);
      toast({
        title: "User banned",
        description: "The user has been successfully banned.",
      });
      setIsViewDialogOpen(false);
      fetchReports(currentPage);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: "Failed to ban the user. Please try again.",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="container p-4 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Listing Reports Management</h1>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value)} className="mb-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-4 lg:w-1/2">
            <TabsTrigger value="all">All Reports</TabsTrigger>
            <TabsTrigger value="vehicle">Vehicle Reports</TabsTrigger>
            <TabsTrigger value="auction">Auction Reports</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="w-full">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-8 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : reports.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report:any) => (
                <Card key={report.reportId} className="w-full">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {report.reportedVehicle 
                          ? `Vehicle: ${report.reportedVehicle.make} ${report.reportedVehicle.model}`
                          : report.reportedAuction?.vehicle 
                            ? `Auction: ${report.reportedAuction.vehicle.make} ${report.reportedAuction.vehicle.model}`
                            : `Auction: ${report.reportedAuction?.title || "Unknown"}`}
                      </CardTitle>
                      <Badge 
                        variant={report.status === "resolved" ? "outline" : "destructive"}
                        className="ml-2"
                      >
                        {report.status || "Pending"}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">
                      {/* Report #{report.reportId.slice(0, 8)} */}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 h-16 overflow-hidden text-sm">
                      <p className="line-clamp-3">{report.reportDescription}</p>
                    </div>
                    <div className="flex items-center mt-2 text-sm">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback>{report.reportedBy.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>Reported by: {report.reportedBy.username}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(report.reportedAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => handleViewReport(report)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="flex justify-between items-center mt-8">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => fetchReports(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fetchReports(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No reports found</h3>
            <p className="text-muted-foreground mt-2">
              There are no listing reports {activeTab !== "all" ? `in the "${activeTab}" category` : ""} at the moment.
            </p>
          </div>
        )}
      </div>

      {selectedReport && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-medium text-base">Report Information</h3>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Report ID:</div>
                  <div>{selectedReport.reportId}</div>
                  <div className="text-muted-foreground">Submitted:</div>
                  <div>{new Date(selectedReport.reportedAt).toLocaleString()}</div>
                  <div className="text-muted-foreground">Status:</div>
                  <div>
                    <Badge variant={selectedReport.status === "resolved" ? "outline" : "destructive"}>
                      {selectedReport.status || "Pending"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-base">Description</h3>
                <Separator className="my-2" />
                <p className="text-sm whitespace-pre-wrap">{selectedReport.reportDescription}</p>
              </div>

              <div>
                <h3 className="font-medium text-base">Reporter Information</h3>
                <Separator className="my-2" />
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar>
                    <AvatarFallback>{selectedReport.reportedBy.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedReport.reportedBy.username}</p>
                    <p className="text-sm text-muted-foreground">{selectedReport.reportedBy.email}</p>
                  </div>
                </div>
              </div>

              {selectedReport.reportedVehicle && (
                <div>
                  <h3 className="font-medium text-base">Reported Vehicle</h3>
                  <Separator className="my-2" />
                  <div className="flex space-x-3">
                    {selectedReport.reportedVehicle.image_url && (
                      <img 
                        src={selectedReport.reportedVehicle.image_url} 
                        alt="Vehicle" 
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{selectedReport.reportedVehicle.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedReport.reportedVehicle.make} {selectedReport.reportedVehicle.model} ({selectedReport.reportedVehicle.year})
                      </p>
                      {selectedReport.reportedVehicle.seller && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Seller: </span>
                          {selectedReport.reportedVehicle.seller.username} ({selectedReport.reportedVehicle.seller.email})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedReport.reportedAuction && (
                <div>
                  <h3 className="font-medium text-base">Reported Auction</h3>
                  <Separator className="my-2" />
                  <div className="flex space-x-3">
                    {selectedReport.reportedAuction.vehicle?.image_url ? (
                      <img 
                        src={selectedReport.reportedAuction.vehicle.image_url} 
                        alt="Auction Vehicle" 
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-muted flex items-center justify-center rounded-md">
                        <Car className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{selectedReport.reportedAuction.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Starting Price: ${selectedReport.reportedAuction.startingPrice}
                      </p>
                      
                      {selectedReport.reportedAuction.vehicle && (
                        <div className="mt-2 border-l-2 pl-2 py-1 border-muted">
                          <p className="text-sm font-medium">
                            {selectedReport.reportedAuction.vehicle.make} {selectedReport.reportedAuction.vehicle.model} ({selectedReport.reportedAuction.vehicle.year})
                          </p>
                          <p className="text-xs text-muted-foreground">{selectedReport.reportedAuction.vehicle.title}</p>
                        </div>
                      )}
                      
                      {selectedReport.reportedAuction.seller && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Seller: </span>
                          {selectedReport.reportedAuction.seller.username} ({selectedReport.reportedAuction.seller.email})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsViewDialogOpen(false)}
                className="sm:order-1"
              >
                Close
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteReport(selectedReport.reportId)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Report
                </Button>
                <Button 
                  variant="default"
                  onClick={() => handleResolveReport(selectedReport.reportId)}
                  disabled={selectedReport.status === "resolved"}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
                {(selectedReport.reportedVehicle?.seller || selectedReport.reportedAuction?.seller) && (
                  <Button 
                    variant="destructive"
                    onClick={() => handleBanUser(
                      selectedReport.reportedVehicle?.seller?.id || 
                      selectedReport.reportedAuction?.seller?.id
                    )}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Ban Seller
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}