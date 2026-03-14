import { createClient } from "@/lib/supabase/server";

export interface SigunguItem {
  area_code: string;
  name_ko: string;
  name_en: string;
}

export async function getSigunguList(areaCode: string): Promise<SigunguItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("regions")
    .select("area_code, name_ko, name_en")
    .eq("parent_area_code", areaCode)
    .order("name_ko");
  return (data as SigunguItem[]) ?? [];
}
