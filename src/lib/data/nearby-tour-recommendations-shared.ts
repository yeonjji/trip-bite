export type NearbyTourType = "travel" | "festival" | "accommodation" | "restaurant" | "cafe";

export interface NearbyTourItem {
  id: string;
  contentId: string;
  title: string;
  type: NearbyTourType;
  address: string;
  image: string;
  lat: number;
  lng: number;
  distance: number;
}

export type NearbyTourRecommendations = Record<NearbyTourType, NearbyTourItem[]>;

export const NEARBY_TOUR_PLACEHOLDER_IMAGE = "/file.svg";
