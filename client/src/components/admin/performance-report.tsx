import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Download, TrendingUp, Car, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { analyzeVehicleData, generateChartData, formatCurrency, formatPercent } from "@/lib/report-generator";
import type { Vehicle } from "@shared/schema";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

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
  highlight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 8,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 24,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
  },
  tableCell: {
    flex: 1,
    padding: 5,
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
          <Text style={styles.subtitle}>Executive Summary</Text>
          <Text style={styles.text}>Total Active Listings: {metrics.totalListings}</Text>
          <Text style={styles.text}>Average Vehicle Price: {formatCurrency(metrics.averagePrice)}</Text>
          <Text style={styles.text}>Price Range: {formatCurrency(metrics.priceRange.min)} - {formatCurrency(metrics.priceRange.max)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Price Range Analysis</Text>
          {Object.entries(metrics.priceRangeDistribution).map(([range, count]) => (
            <Text key={range} style={styles.text}>
              {range}: {count} vehicles ({formatPercent(count, metrics.totalListings)})
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Most Popular Features</Text>
          {metrics.topFeatures.map((feature, index) => (
            <Text key={feature} style={styles.text}>
              {index + 1}. {feature.charAt(0).toUpperCase() + feature.slice(1)}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Distribution Analysis</Text>
          <Text style={styles.text}>Categories: {Object.entries(metrics.categoryDistribution).map(([category, count]) => 
            `${category}: ${count} (${formatPercent(count, metrics.totalListings)})`
          ).join(', ')}</Text>
          <Text style={styles.text}>Makes: {Object.entries(metrics.makeDistribution).map(([make, count]) => 
            `${make}: ${count} (${formatPercent(count, metrics.totalListings)})`
          ).join(', ')}</Text>
          <Text style={styles.text}>Body Types: {Object.entries(metrics.bodyTypeDistribution).map(([type, count]) => 
            `${type}: ${count} (${formatPercent(count, metrics.totalListings)})`
          ).join(', ')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Location Distribution</Text>
          {Object.entries(metrics.locationHeatmap)
            .sort(([,a], [,b]) => b - a)
            .map(([location, count]) => (
              <Text key={location} style={styles.text}>
                {location}: {count} vehicles ({formatPercent(count, metrics.totalListings)})
              </Text>
            ))}
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4" />
              Most Popular Make
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {Object.entries(metrics.makeDistribution)
                .sort(([,a], [,b]) => b - a)[0][0]}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Top Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {Object.entries(metrics.locationHeatmap)
                .sort(([,a], [,b]) => b - a)[0][0]}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
            <CardTitle>Price Range Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar 
              data={chartData.priceRangeChart}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {metrics.topFeatures.map((feature, index) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="font-bold">{index + 1}.</span>
                  <span className="capitalize">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location Heat Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(metrics.locationHeatmap)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([location, count]) => (
                  <div key={location} className="flex justify-between items-center">
                    <span className="capitalize">{location}</span>
                    <span className="text-sm text-muted-foreground">
                      {count} vehicles ({formatPercent(count, metrics.totalListings)})
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}