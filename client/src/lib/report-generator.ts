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
  priceRangeDistribution: {
    under10k: number;
    '10k-20k': number;
    '20k-30k': number;
    '30k-50k': number;
    above50k: number;
  };
  locationHeatmap: Record<string, number>;
  topFeatures: string[];
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
    priceRangeDistribution: {
      under10k: 0,
      '10k-20k': 0,
      '20k-30k': 0,
      '30k-50k': 0,
      above50k: 0,
    },
    locationHeatmap: {},
    topFeatures: [],
  };

  // Calculate price metrics and distributions
  const totalPrice = vehicles.reduce((sum, vehicle) => {
    // Price range
    metrics.priceRange.min = Math.min(metrics.priceRange.min, vehicle.price);
    metrics.priceRange.max = Math.max(metrics.priceRange.max, vehicle.price);

    // Price range distribution
    if (vehicle.price < 10000) metrics.priceRangeDistribution.under10k++;
    else if (vehicle.price < 20000) metrics.priceRangeDistribution['10k-20k']++;
    else if (vehicle.price < 30000) metrics.priceRangeDistribution['20k-30k']++;
    else if (vehicle.price < 50000) metrics.priceRangeDistribution['30k-50k']++;
    else metrics.priceRangeDistribution.above50k++;

    // Location distribution
    metrics.locationHeatmap[vehicle.location] = (metrics.locationHeatmap[vehicle.location] || 0) + 1;

    return sum + vehicle.price;
  }, 0);
  metrics.averagePrice = totalPrice / vehicles.length;

  // Calculate distributions
  vehicles.forEach((vehicle) => {
    metrics.categoryDistribution[vehicle.category] = (metrics.categoryDistribution[vehicle.category] || 0) + 1;
    metrics.makeDistribution[vehicle.make] = (metrics.makeDistribution[vehicle.make] || 0) + 1;
    metrics.bodyTypeDistribution[vehicle.bodyType] = (metrics.bodyTypeDistribution[vehicle.bodyType] || 0) + 1;
  });

  // Get top features (from descriptions)
  const featureRegex = /(air conditioning|navigation|leather|bluetooth|parking sensors|cruise control|heated seats)/gi;
  const features: Record<string, number> = {};
  vehicles.forEach(vehicle => {
    const matches = vehicle.description.match(featureRegex) || [];
    matches.forEach(feature => {
      features[feature.toLowerCase()] = (features[feature.toLowerCase()] || 0) + 1;
    });
  });
  metrics.topFeatures = Object.entries(features)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([feature]) => feature);

  return metrics;
}

export function generateChartData(metrics: VehicleMetrics) {
  const chartColors = {
    primary: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#47B39C'],
    secondary: ['#FFB1C1', '#9BD0F5', '#FFE7AA', '#A5E0E0', '#CCB3FF', '#FFCF9F', '#A3D9CF'],
  };

  return {
    categoryChart: {
      labels: Object.keys(metrics.categoryDistribution),
      datasets: [{
        data: Object.values(metrics.categoryDistribution),
        backgroundColor: chartColors.primary.slice(0, Object.keys(metrics.categoryDistribution).length),
      }],
    },
    makeChart: {
      labels: Object.keys(metrics.makeDistribution),
      datasets: [{
        data: Object.values(metrics.makeDistribution),
        backgroundColor: chartColors.secondary.slice(0, Object.keys(metrics.makeDistribution).length),
      }],
    },
    bodyTypeChart: {
      labels: Object.keys(metrics.bodyTypeDistribution),
      datasets: [{
        data: Object.values(metrics.bodyTypeDistribution),
        backgroundColor: chartColors.primary.slice(0, Object.keys(metrics.bodyTypeDistribution).length),
      }],
    },
    priceRangeChart: {
      labels: Object.keys(metrics.priceRangeDistribution),
      datasets: [{
        data: Object.values(metrics.priceRangeDistribution),
        backgroundColor: chartColors.secondary.slice(0, Object.keys(metrics.priceRangeDistribution).length),
      }],
    },
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, total: number): string {
  return `${Math.round((value / total) * 100)}%`;
}