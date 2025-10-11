import { eq, gte, ilike, lte, min, SQL, sql } from "drizzle-orm";
import { vehicles, vehicleTypesEnum, vehicleConditionsEnum } from "../../shared/schema";
import { RedisService } from "./RedisService";
import axios from "axios";
import { REDIS_KEYS } from "server/utils/constants";


export class VehicleService {

    static async externalApiCall({ postalCode, maxBudget, minBudget, distance }: any): Promise<any> {
        const apiKey = process.env.ONE_AUTO_API_KEY;
        const url = process.env.ONT_AUTO_VEHICLE_API_URL;
        if (!apiKey || !url) {
            console.error("ONE_AUTO_API_KEY or URL is not set in environment variables");
            return [];
        }
        try {


            let _maxBudget = parseInt(maxBudget || "");
            let _minBudget = parseInt(minBudget || "");
            // let _distance = this.extractDistanceValue(distance as string);
            //these three are the conditions to make the external API call
            //TODO: validate uk postal code before making the call 
            if (!postalCode || postalCode.trim() === "" || isNaN(_maxBudget) || isNaN(_minBudget)) {
                console.error("Postal code, maxBudget, minBudget are required for external API call");
                return [];
            }
            //verfy the postal code 
            let validUkPostalCode = await this.validatePostalCode(postalCode);

            if (!validUkPostalCode){
                console.error("Invalid UK postal code");
                return [];
            }

            //restrict the min and max range 
            if (_minBudget < 1000 || _minBudget > 1000000 || _maxBudget < 1000 || _maxBudget > 1000000 || _minBudget > _maxBudget) {
                console.error("Invalid budget range");
                return [];
            }

            const params = new URLSearchParams({
                postal_code: postalCode,
                price_from_gbp: minBudget || "",
                price_to_gbp: maxBudget || "",
            });
            // if (_distance !== null) {
            //     params.append("radius_miles", _distance.toString());
            // }
            const response = await axios.get(`${url}?${params.toString()}`, {
                headers: {
                    'x-api-key': apiKey
                }
            });


            console.log(response.data);

            if (!response.data || !response.data.result || !Array.isArray(response.data.result.advert_list || response.data.result.advert_list.length == 0)) {
                console.error("Invalid response structure from external API");
                return [];
            }

            const transformed_result = this.transformExternalToInternal(response.data);

            //CACHE IT
            const cacheDuration = 10 * 60 * 60; //10 hours
            await RedisService.addCache(REDIS_KEYS.EXTERNAL_CLASSIFIED_LISTING + `:postal_code:${postalCode}-minBudget:${_minBudget}-maxBudget:${_maxBudget}`, transformed_result, cacheDuration);

            return transformed_result;

        } catch (error: any) {
            console.error("Error during external API call:", error.message);
            return [];
        }
    }

    private static transformExternalToInternal(externalData: any): any[] {
        let index = 0;
        return externalData.result.advert_list.map((advert: any) => ({
            index: index++,
            id: `ext_${advert.advert_id}`, // Prefix to identify external sources
            make: advert.vehicle_data.manufacturer_desc,
            model: advert.vehicle_data.model_range_desc,
            year: advert.vehicle_data.first_registration_year,
            price: advert.advertised_price_gbp,
            mileage: advert.mileage_observed,
            fuelType: advert.vehicle_data.fuel_type_desc,
            transmission: advert.vehicle_data.transmission_desc,
            bodyType: advert.vehicle_data.body_type_desc,
            color: advert.colour,
            condition: advert.ownership_condition,
            latitude: advert.vehicle_location_details.latitude,
            longitude: advert.vehicle_location_details.longitude,
            images: advert.image_links,
            externalUrl: advert.vehicle_details_page_url,
            source: 'external_market',
        }));
    }

    static extractDistanceValue(distance: string): number | null {
        const distanceString: string =
            distance || (distance as string).toLowerCase() !== "national"
                ? (distance as string).toLowerCase()
                : "";
        const match = distanceString.match(/^within\s+(\d+)\s+mile(s)?$/i);
        if (match) {
            const distanceValue = parseInt(match[1], 10);
            return distanceValue;
        }
        return null;
    }

    private static async validatePostalCode(postalCode: string) {
        try {
            const response = await axios.get(
                "https://api.postcodes.io/postcodes/" + postalCode
            );
            return response;
        } catch (e) {
            console.error("Error validating postcal code: ", e);
            return null;
        }
    }

    static buildbuildSearchConditions({
        make,
        model,
        type,
        postalCode,
        transmissionType,
        color,
        bodyType,
        fuelType,
        minBudget,
        maxBudget,
        latitude,
        longitude,
        distance,
        vehicleCondition,
        fromYear,
        toYear,
        minMileage,
        maxMileage,
    }: any): any[] {
        let conditions: any[] = [];
        if (make && String(make).toLowerCase() !== "all")
            conditions.push(eq(vehicles.make, String(make)));
        if (model && String(model).toLowerCase() !== "all")
            conditions.push(eq(vehicles.model, String(model)));
        if (
            type &&
            String(type).toLowerCase() !== "all" &&
            (type as (typeof vehicleTypesEnum.enumValues)[number])
        )
            conditions.push(
                eq(vehicles.type, type as (typeof vehicleTypesEnum.enumValues)[number])
            );
        if (transmissionType && String(transmissionType).toLowerCase() !== "all")
            conditions.push(eq(vehicles.transmission, String(transmissionType)));
        if (fuelType && String(fuelType).toLowerCase() !== "all")
            conditions.push(eq(vehicles.fuelType, String(fuelType)));
        if (bodyType && String(bodyType).toLowerCase() !== "all")
            conditions.push(eq(vehicles.bodyType, String(bodyType)));
        if (
            vehicleCondition &&
            vehicleConditionsEnum.enumValues.includes(vehicleCondition as any)
        ) {
            conditions.push(eq(vehicles.condition, vehicleCondition as any));
        }
        if (color && String(color).toLowerCase() !== "all")
            conditions.push(ilike(vehicles.color, String(color)));
        if (!isNaN(Number(minBudget)) && Number(minBudget) > 0)
            conditions.push(gte(vehicles.price, Number(minBudget)));
        if (!isNaN(Number(maxBudget)) && Number(maxBudget) > 0)
            conditions.push(lte(vehicles.price, Number(maxBudget)));
        if (!isNaN(Number(fromYear)))
            conditions.push(gte(vehicles.year, Number(fromYear)));
        if (!isNaN(Number(toYear)))
            conditions.push(lte(vehicles.year, Number(toYear)));
        if (!isNaN(Number(minMileage)))
            conditions.push(gte(vehicles.mileage, Number(minMileage)));
        if (!isNaN(Number(maxMileage)))
            conditions.push(lte(vehicles.mileage, Number(maxMileage)));

        //logic to fetch vehicles based on the postal code and distance
        if (
            latitude &&
            longitude &&
            !isNaN(parseFloat(latitude as string)) &&
            !isNaN(parseFloat(longitude as string))
        ) {
            const distanceValue = this.extractDistanceValue(distance as string);
            if (distanceValue !== null) {
                const lat = parseFloat(latitude as string);
                const lon = parseFloat(longitude as string);
                //haversine formula
                //3969 ---> Earth's radius in miles
                conditions.push(sql`
             3959 * acos(
               cos(radians(${lat})) *
               cos(radians(${vehicles.latitude})) *
               cos(radians(${vehicles.longitude}) - radians(${lon})) +
               sin(radians(${lat})) *  
               sin(radians(${vehicles.latitude}))
             ) <= ${distanceValue}
           `);
            } else {
                console.warn("Invalid format: expected 'within <number> miles'");
            }
        }

        return conditions
    }

    static buildSortOption(sortBy: string | undefined, latitude?: string | undefined, longitude?: string | undefined): SQL {
        let orderByClause = sql`${vehicles.createdAt} DESC`;
        if (sortBy === "oldest") {
            orderByClause = sql`${vehicles.createdAt} ASC`;
        } else if (sortBy === "price_low") {
            orderByClause = sql`${vehicles.price} ASC`;
        } else if (sortBy === "price_high") {
            orderByClause = sql`${vehicles.price} DESC`;
        } else if (sortBy === "mileage_low") {
            orderByClause = sql`${vehicles.mileage} ASC`;
        } else if (sortBy === "mileage_high") {
            orderByClause = sql`${vehicles.mileage} ASC`;
        } else if (sortBy === "nearest_first" && latitude && longitude) {
            const lat = parseFloat(latitude as string);
            const lon = parseFloat(longitude as string);
            orderByClause = sql`
              3959 * acos(
                cos(radians(${lat})) *
                cos(radians(${vehicles.latitude})) *
                cos(radians(${vehicles.longitude}) - radians(${lon})) +
                sin(radians(${lat})) *  
                sin(radians(${vehicles.latitude}))
              ) ASC
            `;
        }
        return orderByClause;
    }
}