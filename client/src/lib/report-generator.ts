import type { Vehicle } from "@shared/schema";
import { format } from "date-fns";

interface VehicleMetrics {
  totalListings: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  categoryDistribution: Record<string, number>;
  makeDistribution: Record<string, number>;
  bodyTypeDistribution: Record<string, number>;
}

export function analyzeVehicleData(vehicles: Vehicle[]): VehicleMetrics {
  const metrics: VehicleMetrics = {
    totalListings: vehicles.length,
    averagePrice: 0,
    priceRange: {
      min: Infinity,
      max: -Infinity,
    },
    categoryDistribution: {},
    makeDistribution: {},
    bodyTypeDistribution: {},
  };

  // Calculate price metrics
  const totalPrice = vehicles.reduce((sum, vehicle) => {
    metrics.priceRange.min = Math.min(metrics.priceRange.min, vehicle.price);
    metrics.priceRange.max = Math.max(metrics.priceRange.max, vehicle.price);
    return sum + vehicle.price;
  }, 0);
  metrics.averagePrice = totalPrice / vehicles.length;

  // Calculate distributions
  vehicles.forEach((vehicle) => {
    metrics.categoryDistribution[vehicle.category] = (metrics.categoryDistribution[vehicle.category] || 0) + 1;
    metrics.makeDistribution[vehicle.make] = (metrics.makeDistribution[vehicle.make] || 0) + 1;
    metrics.bodyTypeDistribution[vehicle.bodyType] = (metrics.bodyTypeDistribution[vehicle.bodyType] || 0) + 1;
  });

  return metrics;
}

export function generateChartData(metrics: VehicleMetrics) {
  return {
    categoryChart: {
      labels: Object.keys(metrics.categoryDistribution),
      datasets: [{
        data: Object.values(metrics.categoryDistribution),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ],
      }],
    },
    makeChart: {
      labels: Object.keys(metrics.makeDistribution),
      datasets: [{
        data: Object.values(metrics.makeDistribution),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#47B39C'
        ],
      }],
    },
    bodyTypeChart: {
      labels: Object.keys(metrics.bodyTypeDistribution),
      datasets: [{
        data: Object.values(metrics.bodyTypeDistribution),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#47B39C'
        ],
      }],
    },
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(value);
}
