import { Client } from "@googlemaps/google-maps-services-js";
import { PlaceData } from "@googlemaps/google-maps-services-js";

const client = new Client({});

let directionsService: google.maps.DirectionsService | null = null;

export function initializeDirectionsService() {
  if (!directionsService) {
    directionsService = new google.maps.DirectionsService();
  }
}

export async function getDirections(origin: string, destination: string, mode: google.maps.TravelMode = google.maps.TravelMode.WALKING): Promise<google.maps.DirectionsResult> {
  if (!directionsService) {
    throw new Error('Directions service not initialized');
  }

  try {
    const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
      directionsService!.route(
        {
          origin: origin,
          destination: destination,
          travelMode: mode,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            resolve(result!);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        }
      );
    });

    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes('NOT_FOUND')) {
      const placesResult = await searchPlaces(destination);
      if (placesResult.length > 0 && placesResult[0].formatted_address) {
        return getDirections(origin, placesResult[0].formatted_address, mode);
      } else {
        throw new Error('目的地が見つかりません。正確な住所や場所名を入力してください。');
      }
    }
    throw error;
  }
}

async function searchPlaces(query: string): Promise<Partial<PlaceData>[]> {
  const response = await client.textSearch({
    params: {
      query: query,
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    },
  });

  return response.data.results;
}

export async function interpretDirectionsWithGemini(directionsData: google.maps.DirectionsResult): Promise<string> {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_INTERPRET_DIRECTIONS_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directionsData }),
      credentials: 'include'
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to interpret directions: ${response.status} ${response.statusText}. ${errorText}`);
    }
    const { interpretation } = await response.json();
    return interpretation;
  } catch (error) {
    console.error('Error in interpretDirectionsWithGemini:', error);
    throw error;
  }
}