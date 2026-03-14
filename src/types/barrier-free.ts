export interface BarrierFreePlace {
  id: string;
  content_id: string;
  content_type_id?: string;
  title: string;
  addr1: string;
  addr2?: string;
  area_code: string;
  sigungu_code?: string;
  mapx?: number;
  mapy?: number;
  first_image?: string;
  first_image2?: string;
  tel?: string;
  homepage?: string;
  overview?: string;
  // 무장애 전용 필드
  wheelchair?: string;      // 휠체어 대여
  exit_accessible?: string; // 출입구 접근
  restroom_wh?: string;     // 장애인 화장실
  elevator?: string;        // 엘리베이터
  parking_wh?: string;      // 장애인 주차
  braileblock?: string;     // 점자블록
  signguide?: string;       // 점자 안내판
  audioguide?: string;      // 오디오 가이드
  rating_avg: number;
  rating_count: number;
  cached_at?: string;
  created_at: string;
  updated_at: string;
}
