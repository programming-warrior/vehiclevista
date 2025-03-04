import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from 'chart.js';
import { analyzeVehicleData, generateChartData, formatCurrency } from "@/lib/report-generator";
import type { Vehicle } from "@shared/schema";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
});

export default function PerformanceReport() {
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  if (isLoading || !vehicles) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const metrics = analyzeVehicleData(vehicles);
  const chartData = generateChartData(metrics);

  const PDFReport = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Vehicle Inventory Performance Report</Text>
          <Text style={styles.text}>Generated on: {new Date().toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.subtitle}>Key Metrics</Text>
          <Text style={styles.text}>Total Listings: {metrics.totalListings}</Text>
          <Text style={styles.text}>Average Price: {formatCurrency(metrics.averagePrice)}</Text>
          <Text style={styles.text}>Price Range: {formatCurrency(metrics.priceRange.min)} - {formatCurrency(metrics.priceRange.max)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Distribution Analysis</Text>
          <Text style={styles.text}>Categories: {Object.entries(metrics.categoryDistribution).map(([category, count]) => 
            `${category}: ${count}`
          ).join(', ')}</Text>
          <Text style={styles.text}>Makes: {Object.entries(metrics.makeDistribution).map(([make, count]) => 
            `${make}: ${count}`
          ).join(', ')}</Text>
          <Text style={styles.text}>Body Types: {Object.entries(metrics.bodyTypeDistribution).map(([type, count]) => 
            `${type}: ${count}`
          ).join(', ')}</Text>
        </View>
      </Page>
    </Document>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Report</h2>
        <PDFDownloadLink
          document={<PDFReport />}
          fileName={`vehicle-performance-report-${new Date().toISOString().split('T')[0]}.pdf`}
        >
          {({ loading }) => (
            <Button disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </>
              )}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalListings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Average Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.averagePrice)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Price Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.priceRange.min)} - {formatCurrency(metrics.priceRange.max)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <Doughnut data={chartData.categoryChart} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Makes</CardTitle>
          </CardHeader>
          <CardContent>
            <Doughnut data={chartData.makeChart} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Body Types</CardTitle>
          </CardHeader>
          <CardContent>
            <Doughnut data={chartData.bodyTypeChart} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
