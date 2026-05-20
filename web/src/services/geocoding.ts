const NOMINATIM_BASE_URL =
  import.meta.env.VITE_NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';

interface NominatimReverseResponse {
  display_name?: string;
  address?: NominatimAddress;
}

interface NominatimSearchResponseItem {
  lat: string;
  lon: string;
  display_name?: string;
  address?: NominatimAddress;
}

interface NominatimAddress {
  road?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  hamlet?: string;
}

export interface GeocodedLocation {
  lat: number;
  lng: number;
  displayName?: string;
}

const defaultParams = {
  format: 'jsonv2',
  addressdetails: '1',
};

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

function normalizeAddressPart(value?: string): string | null {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
}

function formatAddress(address?: NominatimAddress): string | null {
  if (!address) {
    return null;
  }

  const street = normalizeAddressPart(address.road);
  const houseNumber = normalizeAddressPart(address.house_number);
  const city = normalizeAddressPart(
    address.city ?? address.town ?? address.village ?? address.municipality ?? address.hamlet,
  );

  const streetLine = [street, houseNumber].filter(Boolean).join(' ').trim();
  const formattedAddress = [streetLine, city].filter(Boolean).join(', ').trim();

  return formattedAddress || null;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const url = new URL('/reverse', NOMINATIM_BASE_URL);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('zoom', '18');

  Object.entries(defaultParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const data = await fetchJson<NominatimReverseResponse>(url);
  return formatAddress(data.address);
}

export async function geocodeAddress(query: string): Promise<GeocodedLocation | null> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return null;
  }

  const url = new URL('/search', NOMINATIM_BASE_URL);
  url.searchParams.set('q', trimmedQuery);
  url.searchParams.set('limit', '1');

  Object.entries(defaultParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const results = await fetchJson<NominatimSearchResponseItem[]>(url);
  const firstMatch = results[0];

  if (!firstMatch) {
    return null;
  }

  return {
    lat: Number(firstMatch.lat),
    lng: Number(firstMatch.lon),
    displayName: formatAddress(firstMatch.address) || trimmedQuery,
  };
}
