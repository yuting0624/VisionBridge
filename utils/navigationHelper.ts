import { Client, TravelMode } from "@googlemaps/google-maps-services-js";

const client = new Client({});

export async function getDirections(origin: string, destination: string, mode: 'walking' | 'driving' | 'transit' = 'walking') {
  const response = await client.directions({
    params: {
      origin: origin,
      destination: destination,
      mode: mode as TravelMode,
      key: process.env.GOOGLE_MAPS_API_KEY!,
    },
  });

  return response.data.routes[0];
}