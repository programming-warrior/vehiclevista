import { parse } from "csv-parse";
import { Readable } from "stream";

export type Vehicle = {
  title: string;
  type: string;
  make: string;
  model: string;
  price: string;
  year: string;
  mileage: string;
  fuelType: string;
  transmission: string;
  bodyType: string;
  registration_num: string;
  color: string;
  description: string;
  location: string;
  images: string[];
  condition: string;
  openToPX: boolean;
  negotiable: boolean;
};

function cleanString(val: string): string {
    return val.trim().replace(/^"+|"+$/g, '');
  }

export function extractVehicles(data: string[][]): Vehicle[] {
  const vehicles: Vehicle[] = [];
  let firstRow = 0;
  if (data[0].length === 0) firstRow++;
  console.log(firstRow);

  const headers = data[firstRow].map((h) => h.trim().toLocaleLowerCase());

  const getIndex = (key: string) => headers.indexOf(key.toLowerCase());

  const indices = {
    title: getIndex("title"),
    type: getIndex("type"),
    make: getIndex("make"),
    model: getIndex("model"),
    price: getIndex("price"),
    year: getIndex("year"),
    mileage: getIndex("mileage"),
    fuelType: getIndex("fuelType"),
    transmission: getIndex("transmission"),
    bodyType: getIndex("bodyType"),
    registration_num: getIndex("registration_num"),
    color: getIndex("color"),
    description: getIndex("description"),
    location: getIndex("location"),
    images: getIndex("images"),
    condition: getIndex("condition"),
    openToPX: getIndex("openToPX"),
    negotiable: getIndex("negotiable"),
  };

  // Check for missing required fields
  for (const [key, idx] of Object.entries(indices)) {
    if (idx === -1 && key !== "openToPX" && key !== "negotiable") {
      throw new Error(`Missing field in CSV: ${key} or Incorrect CSV format`);
    }
  }

  data.slice(firstRow + 1).forEach((row) => {
    const parseBool = (val: string) => val?.toLowerCase() === "true";
    vehicles.push({
      title: cleanString(row[indices.title]),
      type: cleanString(row[indices.type]),
      make: cleanString(row[indices.make]),
      model: cleanString(row[indices.model]),
      price: cleanString(row[indices.price]),
      year: cleanString(row[indices.year]),
      mileage: cleanString(row[indices.mileage]),
      fuelType: cleanString(row[indices.fuelType]),
      transmission: cleanString(row[indices.transmission]),
      bodyType: cleanString(row[indices.bodyType]),
      registration_num: cleanString(row[indices.registration_num]),
      color: cleanString(row[indices.color]),
      description: cleanString(row[indices.description]),
      location: cleanString(row[indices.location]),
      images: cleanString(row[indices.images])?.split(";") ?? [],
      condition: cleanString(row[indices.condition]),
      openToPX: parseBool(row[indices.openToPX] || "false"),
      negotiable: parseBool(row[indices.negotiable] || "false"),
    });
  });

  return vehicles;
}

export function parseCsvFile(buffer: Buffer): Promise<string[][]> {
    const csvText = buffer.toString("utf8");
  
    return new Promise((resolve, reject) => {
      parse(
        csvText,
        {
          delimiter: ",",
          trim: true,               // remove leading/trailing whitespace
          skip_empty_lines: true,   // ignore blank lines
          quote: '"',               // recognize double‑quoted fields
          escape: '"',              // double quotes are escaped by doubling
        },
        (err, records: string[][]) => {
          if (err) return reject(err);
          resolve(records);
        }
      );
    });
  }
