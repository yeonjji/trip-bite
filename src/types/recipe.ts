// P1-06: 레시피 타입 (식품의약품안전처 COOKRCP01 API)

// COOKRCP01 API 응답
export interface CookRcpApiResponse {
  COOKRCP01: {
    row: CookRcpItem[];
    total_count: string;
    RESULT: {
      MSG: string;
      CODE: string;
    };
  };
}

export interface CookRcpItem {
  RCP_SEQ: string;         // 레시피 일련번호
  RCP_NM: string;          // 메뉴명
  RCP_WAY2: string;        // 조리방법 (볶기, 끓이기 등)
  RCP_PAT2: string;        // 요리종류 (반찬, 국/탕, 후식 등)
  INFO_WGT?: string;       // 중량 (1인분)
  INFO_ENG?: string;       // 열량 (kcal)
  INFO_CAR?: string;       // 탄수화물 (g)
  INFO_PRO?: string;       // 단백질 (g)
  INFO_FAT?: string;       // 지방 (g)
  INFO_NA?: string;        // 나트륨 (mg)
  HASH_TAG?: string;       // 해시태그
  ATT_FILE_NO_MAIN?: string; // 대표 이미지
  ATT_FILE_NO_MK?: string;   // 완성 이미지
  RCP_PARTS_DTLS?: string;   // 재료 정보
  // 조리 순서 (최대 20단계)
  MANUAL01?: string; MANUAL_IMG01?: string;
  MANUAL02?: string; MANUAL_IMG02?: string;
  MANUAL03?: string; MANUAL_IMG03?: string;
  MANUAL04?: string; MANUAL_IMG04?: string;
  MANUAL05?: string; MANUAL_IMG05?: string;
  MANUAL06?: string; MANUAL_IMG06?: string;
  MANUAL07?: string; MANUAL_IMG07?: string;
  MANUAL08?: string; MANUAL_IMG08?: string;
  MANUAL09?: string; MANUAL_IMG09?: string;
  MANUAL10?: string; MANUAL_IMG10?: string;
  MANUAL11?: string; MANUAL_IMG11?: string;
  MANUAL12?: string; MANUAL_IMG12?: string;
  MANUAL13?: string; MANUAL_IMG13?: string;
  MANUAL14?: string; MANUAL_IMG14?: string;
  MANUAL15?: string; MANUAL_IMG15?: string;
  MANUAL16?: string; MANUAL_IMG16?: string;
  MANUAL17?: string; MANUAL_IMG17?: string;
  MANUAL18?: string; MANUAL_IMG18?: string;
  MANUAL19?: string; MANUAL_IMG19?: string;
  MANUAL20?: string; MANUAL_IMG20?: string;
}

// 정규화된 레시피 스텝
export interface RecipeStep {
  step: number;
  description: string;
  imageUrl?: string;
}

// 정규화된 레시피
export interface Recipe {
  id: string;              // RCP_SEQ
  name: string;            // RCP_NM
  cookingMethod: string;   // RCP_WAY2
  category: string;        // RCP_PAT2
  mainImageUrl?: string;
  finishedImageUrl?: string;
  ingredients?: string;    // RCP_PARTS_DTLS
  steps: RecipeStep[];
  nutrition: {
    calories?: number;     // kcal
    carbs?: number;        // g
    protein?: number;      // g
    fat?: number;          // g
    sodium?: number;       // mg
  };
  hashTags: string[];
  specialtyId?: string;    // 연결 특산품
  createdAt: string;
  updatedAt: string;
}
