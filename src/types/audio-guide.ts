export interface AudioGuidePlace {
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
  // 오디오 가이드 전용 필드
  audio_url?: string;       // 오디오 파일 URL
  audio_script?: string;    // 오디오 스크립트
  audio_lang?: string;      // 언어 코드 (ko, en, zh, ja)
  audio_duration?: number;  // 재생 시간 (초)
  rating_avg: number;
  rating_count: number;
  cached_at?: string;
  created_at: string;
  updated_at: string;
}

// 공공데이터포털 Odii API 응답 타입
export interface OdiiApiItem {
  contentid: string;
  contenttypeid?: string;
  title: string;
  addr1?: string;
  addr2?: string;
  areacode?: string;
  sigungucode?: string;
  mapx?: string;
  mapy?: string;
  firstimage?: string;
  firstimage2?: string;
  tel?: string;
  homepage?: string;
  overview?: string;
  audioUrl?: string;
  script?: string;
  audioLang?: string;
  audioDuration?: string;
}

export interface OdiiApiResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items:
        | {
            item: OdiiApiItem | OdiiApiItem[];
          }
        | ""
        | null;
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}
