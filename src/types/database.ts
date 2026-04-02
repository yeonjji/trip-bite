// P1-07: Supabase DB 공통 타입 (Database interface)

export interface Database {
  public: {
    Tables: {
      regions: {
        Row: Region;
        Insert: Omit<Region, "id" | "created_at">;
        Update: Partial<Omit<Region, "id" | "created_at">>;
      };
      destinations: {
        Row: Destination;
        Insert: Omit<Destination, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Destination, "id" | "created_at">>;
      };
      camping_sites: {
        Row: CampingSite;
        Insert: Omit<CampingSite, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<CampingSite, "id" | "created_at">>;
      };
      specialties: {
        Row: SpecialtyRow;
        Insert: Omit<SpecialtyRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<SpecialtyRow, "id" | "created_at">>;
      };
      recipes: {
        Row: RecipeRow;
        Insert: Omit<RecipeRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<RecipeRow, "id" | "created_at">>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Review, "id" | "created_at">>;
      };
      weather_cache: {
        Row: WeatherCache;
        Insert: Omit<WeatherCache, "id">;
        Update: Partial<Omit<WeatherCache, "id">>;
      };
    };
    Functions: {
      update_rating_summary: {
        Args: { p_target_type: string; p_target_id: string };
        Returns: void;
      };
    };
  };
}

export interface Region {
  id: string;
  area_code: string;
  name_ko: string;
  name_en: string;
  created_at: string;
}

export interface Destination {
  id: string;
  content_id: string;
  content_type_id: string;
  title: string;
  addr1: string;
  addr2?: string;
  area_code: string;
  sigungu_code?: string;
  mapx?: number;
  mapy?: number;
  first_image?: string;
  first_image2?: string;
  cat3?: string;
  tel?: string;
  homepage?: string;
  overview?: string;
  rating_avg: number;
  rating_count: number;
  cached_at: string;
  created_at: string;
  updated_at: string;
}

export interface CampingSite {
  id: string;
  content_id: string;
  faclt_nm: string;
  line_intro?: string;
  do_nm: string;
  sigungu_nm: string;
  addr1: string;
  addr2?: string;
  mapx?: number;
  mapy?: number;
  tel?: string;
  homepage?: string;
  first_image_url?: string;
  induty?: string;
  sbrs_cl?: string;
  animal_cmg_cl?: string;
  brazier_cl?: string;
  site_bottom_cl1?: number;
  site_bottom_cl2?: number;
  site_bottom_cl3?: number;
  site_bottom_cl4?: number;
  site_bottom_cl5?: number;
  gnrl_site_co?: number;
  auto_site_co?: number;
  glamp_site_co?: number;
  carav_site_co?: number;
  rating_avg: number;
  rating_count: number;
  cached_at: string;
  created_at: string;
  updated_at: string;
}

export interface SpecialtyRow {
  id: string;
  name_ko: string;
  name_en?: string;
  region_id: string;
  category: string;
  season: string[];
  description?: string;
  image_url?: string;
  tags?: string[];
  source?: string;
  external_id?: string;
  created_at: string;
  updated_at: string;
}

export interface RecipeRow {
  id: string;
  rcp_seq: string;
  name: string;
  cooking_method?: string;
  category?: string;
  main_image_url?: string;
  finished_image_url?: string;
  ingredients?: string;
  steps: { step: number; description: string; image_url?: string }[];
  nutrition: {
    calories?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
    sodium?: number;
  };
  hash_tags: string[];
  specialty_id?: string;
  source?: string;
  rural_food_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  target_type: "destination" | "camping";
  target_id: string;
  rating: number;
  content?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeatherCache {
  id: string;
  area_code: string;
  nx: number;
  ny: number;
  forecast_data: Record<string, unknown>;
  cached_at: string;
  expires_at: string;
}
