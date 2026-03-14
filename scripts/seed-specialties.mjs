// 특산품 시드 데이터 삽입 스크립트
// 실행: node --env-file=.env.local scripts/seed-specialties.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("필수 환경변수가 없습니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// KorService2 area_code 기준 (014_update_regions_korservice2.sql 적용 후)
// 서울:11, 부산:26, 대구:27, 인천:28, 광주:29, 대전:30, 울산:31, 세종:36110
// 경기:41, 충북:43, 충남:44, 전남:46, 경북:47, 경남:48, 제주:50, 강원:51, 전북:52
const SPECIALTIES = [
  // 서울 (area_code = '11')
  { name_ko: "한과", name_en: "Hangwa", area_code: "11", category: "가공식품", season: ["연중"], description: "쌀, 꿀, 참기름 등으로 만든 전통 한국 과자", tags: ["전통과자", "명절", "선물"] },
  { name_ko: "서울 김치", name_en: "Seoul Kimchi", area_code: "11", category: "가공식품", season: ["연중"], description: "배추김치를 중심으로 한 서울식 김치", tags: ["김치", "발효", "전통"] },
  { name_ko: "설렁탕", name_en: "Seolleongtang", area_code: "11", category: "가공식품", season: ["연중"], description: "소뼈와 양지를 오래 고아 만든 서울 전통 국밥", tags: ["소고기", "국밥", "전통"] },
  // 인천 (area_code = '28')
  { name_ko: "인천 꽃게", name_en: "Incheon Blue Crab", area_code: "28", category: "수산물", season: ["봄", "가을"], description: "서해안에서 잡힌 신선한 꽃게", tags: ["꽃게", "해산물", "서해"] },
  { name_ko: "강화 순무", name_en: "Ganghwa Turnip", area_code: "28", category: "농산물", season: ["가을", "겨울"], description: "강화도 특산 순무로 만든 김치", tags: ["강화", "순무", "김치"] },
  { name_ko: "인천 새우젓", name_en: "Incheon Salted Shrimp", area_code: "28", category: "수산물", season: ["봄", "가을"], description: "서해 소금으로 절인 새우젓", tags: ["새우젓", "발효", "서해"] },
  // 대전 (area_code = '30')
  { name_ko: "성심당 튀김소보로", name_en: "Sungsimwdang Fried Soboro", area_code: "30", category: "가공식품", season: ["연중"], description: "대전 명물 빵집 성심당의 대표 빵", tags: ["빵", "베이커리", "명물"] },
  { name_ko: "대전 두부", name_en: "Daejeon Tofu", area_code: "30", category: "가공식품", season: ["연중"], description: "두부두루치기로 유명한 대전의 두부 요리", tags: ["두부", "콩", "전통"] },
  { name_ko: "충청 한우", name_en: "Chungcheong Hanwoo", area_code: "30", category: "축산물", season: ["연중"], description: "충청 지역에서 사육한 한우", tags: ["한우", "소고기", "축산"] },
  // 대구 (area_code = '27')
  { name_ko: "대구 사과", name_en: "Daegu Apple", area_code: "27", category: "농산물", season: ["가을"], description: "대구 지역의 달콤한 사과", tags: ["사과", "과일", "대구"] },
  { name_ko: "동인동 찜갈비", name_en: "Dongin-dong Braised Ribs", area_code: "27", category: "축산물", season: ["연중"], description: "대구 동인동에서 유래한 매콤한 찜갈비", tags: ["갈비", "찜", "대구"] },
  { name_ko: "납작만두", name_en: "Flat Mandu", area_code: "27", category: "가공식품", season: ["연중"], description: "대구식 납작한 모양의 만두", tags: ["만두", "분식", "대구"] },
  // 광주 (area_code = '29')
  { name_ko: "광주 김치", name_en: "Gwangju Kimchi", area_code: "29", category: "가공식품", season: ["연중"], description: "전라도식 풍부한 양념의 김치", tags: ["김치", "발효", "전라도"] },
  { name_ko: "광주 떡갈비", name_en: "Gwangju Tteokgalbi", area_code: "29", category: "축산물", season: ["연중"], description: "소고기와 돼지고기를 갈아 만든 떡갈비", tags: ["갈비", "소고기", "전라도"] },
  { name_ko: "무등산 수박", name_en: "Mudeungsan Watermelon", area_code: "29", category: "농산물", season: ["여름"], description: "무등산 기슭에서 재배한 당도 높은 수박", tags: ["수박", "여름과일", "광주"] },
  // 부산 (area_code = '26')
  { name_ko: "부산 돼지국밥", name_en: "Busan Pork Rice Soup", area_code: "26", category: "축산물", season: ["연중"], description: "진한 돼지 뼈 육수로 끓인 부산식 국밥", tags: ["돼지국밥", "국밥", "부산"] },
  { name_ko: "씨앗호떡", name_en: "Seed Hotteok", area_code: "26", category: "가공식품", season: ["연중"], description: "해바라기씨 등 견과류를 넣은 부산 명물 호떡", tags: ["호떡", "길거리음식", "부산"] },
  { name_ko: "부산 고등어", name_en: "Busan Mackerel", area_code: "26", category: "수산물", season: ["가을", "겨울"], description: "부산 근해에서 잡힌 신선한 고등어", tags: ["고등어", "생선", "부산"] },
  { name_ko: "기장 미역", name_en: "Gijang Seaweed", area_code: "26", category: "수산물", season: ["봄"], description: "기장 앞바다에서 채취한 참미역", tags: ["미역", "해조류", "기장"] },
  // 울산 (area_code = '31')
  { name_ko: "언양 불고기", name_en: "Eonyang Bulgogi", area_code: "31", category: "축산물", season: ["연중"], description: "언양 방식으로 양념한 한우 불고기", tags: ["불고기", "한우", "울산"] },
  { name_ko: "울산 고래고기", name_en: "Ulsan Whale Meat", area_code: "31", category: "수산물", season: ["연중"], description: "울산 지역의 전통 고래 요리", tags: ["고래", "해산물", "울산"] },
  { name_ko: "배내골 복숭아", name_en: "Baenaegol Peach", area_code: "31", category: "농산물", season: ["여름"], description: "울산 배내골의 달콤한 복숭아", tags: ["복숭아", "여름과일", "울산"] },
  // 세종 (area_code = '36110')
  { name_ko: "세종 복숭아", name_en: "Sejong Peach", area_code: "36110", category: "농산물", season: ["여름"], description: "세종시 일대에서 재배한 복숭아", tags: ["복숭아", "과일", "세종"] },
  { name_ko: "전의 한우", name_en: "Jeonui Hanwoo", area_code: "36110", category: "축산물", season: ["연중"], description: "세종 전의 지역의 한우", tags: ["한우", "소고기", "세종"] },
  { name_ko: "세종 딸기", name_en: "Sejong Strawberry", area_code: "36110", category: "농산물", season: ["봄"], description: "세종 지역에서 재배한 딸기", tags: ["딸기", "봄과일", "세종"] },
  { name_ko: "세종 오이", name_en: "Sejong Cucumber", area_code: "36110", category: "농산물", season: ["여름"], description: "세종 지역에서 재배한 싱싱한 오이", tags: ["오이", "채소", "세종"] },
  // 경기 (area_code = '41')
  { name_ko: "이천 쌀", name_en: "Icheon Rice", area_code: "41", category: "농산물", season: ["가을"], description: "임금님께 진상한 이천의 고품질 쌀", tags: ["쌀", "이천", "임금님진상"] },
  { name_ko: "안성 배", name_en: "Anseong Pear", area_code: "41", category: "농산물", season: ["가을"], description: "안성 지역에서 생산하는 대형 배", tags: ["배", "과일", "안성"] },
  { name_ko: "파주 장단콩", name_en: "Paju Jangdan Soybean", area_code: "41", category: "농산물", season: ["가을"], description: "파주 장단 지역의 고품질 콩", tags: ["콩", "장단", "파주"] },
  { name_ko: "포천 이동갈비", name_en: "Pocheon Idong Galbi", area_code: "41", category: "축산물", season: ["연중"], description: "포천 이동 지역의 숯불 갈비", tags: ["갈비", "숯불", "포천"] },
  // 강원 (area_code = '51')
  { name_ko: "횡성 한우", name_en: "Hoengseong Hanwoo", area_code: "51", category: "축산물", season: ["연중"], description: "강원도 횡성의 청정 한우", tags: ["한우", "소고기", "횡성"] },
  { name_ko: "춘천 닭갈비", name_en: "Chuncheon Dak-galbi", area_code: "51", category: "축산물", season: ["연중"], description: "고추장 양념으로 볶은 춘천식 닭갈비", tags: ["닭갈비", "닭", "춘천"] },
  { name_ko: "강릉 커피", name_en: "Gangneung Coffee", area_code: "51", category: "가공식품", season: ["연중"], description: "커피 거리로 유명한 강릉의 특산 커피", tags: ["커피", "강릉", "카페"] },
  { name_ko: "강원 감자", name_en: "Gangwon Potato", area_code: "51", category: "농산물", season: ["여름"], description: "강원 고랭지에서 재배한 감자", tags: ["감자", "고랭지", "강원"] },
  // 충북 (area_code = '43')
  { name_ko: "충주 사과", name_en: "Chungju Apple", area_code: "43", category: "농산물", season: ["가을"], description: "충주 지역의 고당도 사과", tags: ["사과", "과일", "충주"] },
  { name_ko: "보은 대추", name_en: "Boeun Jujube", area_code: "43", category: "농산물", season: ["가을"], description: "보은 지역의 달콤한 대추", tags: ["대추", "과일", "보은"] },
  { name_ko: "옥천 포도", name_en: "Okcheon Grape", area_code: "43", category: "농산물", season: ["가을"], description: "옥천 지역에서 재배한 포도", tags: ["포도", "과일", "옥천"] },
  // 충남 (area_code = '44')
  { name_ko: "광천 새우젓", name_en: "Gwangcheon Salted Shrimp", area_code: "44", category: "수산물", season: ["봄", "가을"], description: "광천 지역의 전통 새우젓", tags: ["새우젓", "발효", "광천"] },
  { name_ko: "천안 호두과자", name_en: "Cheonan Walnut Cookie", area_code: "44", category: "가공식품", season: ["연중"], description: "천안 명물인 호두 모양의 과자", tags: ["호두과자", "천안", "간식"] },
  { name_ko: "서산 마늘", name_en: "Seosan Garlic", area_code: "44", category: "농산물", season: ["여름"], description: "서산 간척지에서 재배한 마늘", tags: ["마늘", "채소", "서산"] },
  // 전북 (area_code = '52')
  { name_ko: "전주 비빔밥", name_en: "Jeonju Bibimbap", area_code: "52", category: "가공식품", season: ["연중"], description: "다양한 나물과 고추장으로 비빈 전주 대표 음식", tags: ["비빔밥", "전주", "전통"] },
  { name_ko: "고창 복분자", name_en: "Gochang Bokbunja", area_code: "52", category: "농산물", season: ["여름"], description: "고창 지역에서 재배한 복분자", tags: ["복분자", "베리", "고창"] },
  { name_ko: "남원 추어탕", name_en: "Namwon Chueo-tang", area_code: "52", category: "수산물", season: ["연중"], description: "미꾸라지를 넣어 끓인 남원식 추어탕", tags: ["추어탕", "미꾸라지", "남원"] },
  { name_ko: "익산 쌀", name_en: "Iksan Rice", area_code: "52", category: "농산물", season: ["가을"], description: "전북 익산의 고품질 쌀", tags: ["쌀", "곡물", "익산"] },
  // 전남 (area_code = '46')
  { name_ko: "보성 녹차", name_en: "Boseong Green Tea", area_code: "46", category: "농산물", season: ["봄", "여름"], description: "보성 녹차밭에서 재배한 고품질 녹차", tags: ["녹차", "차", "보성"] },
  { name_ko: "여수 갈치", name_en: "Yeosu Hairtail", area_code: "46", category: "수산물", season: ["가을", "겨울"], description: "여수 근해에서 잡힌 은빛 갈치", tags: ["갈치", "생선", "여수"] },
  { name_ko: "담양 대나무", name_en: "Damyang Bamboo", area_code: "46", category: "공예품", season: ["연중"], description: "담양의 대나무로 만든 전통 공예품", tags: ["대나무", "공예", "담양"] },
  { name_ko: "나주 배", name_en: "Naju Pear", area_code: "46", category: "농산물", season: ["가을"], description: "나주 지역에서 생산하는 대형 배", tags: ["배", "과일", "나주"] },
  // 경북 (area_code = '47')
  { name_ko: "안동 찜닭", name_en: "Andong Jjimdak", area_code: "47", category: "축산물", season: ["연중"], description: "간장 양념으로 조린 안동식 찜닭", tags: ["찜닭", "닭", "안동"] },
  { name_ko: "영덕 대게", name_en: "Yeongdeok Snow Crab", area_code: "47", category: "수산물", season: ["겨울", "봄"], description: "영덕 앞바다에서 잡힌 대게", tags: ["대게", "게", "영덕"] },
  { name_ko: "청도 복숭아", name_en: "Cheongdo Peach", area_code: "47", category: "농산물", season: ["여름"], description: "청도 지역의 달콤한 복숭아", tags: ["복숭아", "과일", "청도"] },
  { name_ko: "의성 마늘", name_en: "Uiseong Garlic", area_code: "47", category: "농산물", season: ["여름"], description: "한국 마늘의 본향 의성의 마늘", tags: ["마늘", "채소", "의성"] },
  // 경남 (area_code = '48')
  { name_ko: "통영 굴", name_en: "Tongyeong Oyster", area_code: "48", category: "수산물", season: ["겨울"], description: "통영 청정 바다에서 양식한 굴", tags: ["굴", "해산물", "통영"] },
  { name_ko: "남해 마늘", name_en: "Namhae Garlic", area_code: "48", category: "농산물", season: ["여름"], description: "남해 지역에서 재배한 질 좋은 마늘", tags: ["마늘", "채소", "남해"] },
  { name_ko: "하동 녹차", name_en: "Hadong Green Tea", area_code: "48", category: "농산물", season: ["봄", "여름"], description: "지리산 자락 하동의 야생 녹차", tags: ["녹차", "차", "하동"] },
  { name_ko: "진주 냉면", name_en: "Jinju Naengmyeon", area_code: "48", category: "가공식품", season: ["연중"], description: "해물 육수와 선지를 넣은 진주 냉면", tags: ["냉면", "진주", "전통"] },
  // 제주 (area_code = '50')
  { name_ko: "한라봉", name_en: "Hallabong", area_code: "50", category: "농산물", season: ["겨울", "봄"], description: "제주 특산 감귤류로 당도가 높고 향이 풍부한 과일", tags: ["감귤", "제주", "비타민"] },
  { name_ko: "제주 흑돼지", name_en: "Jeju Black Pork", area_code: "50", category: "축산물", season: ["연중"], description: "제주 재래종 흑돼지로 쫄깃한 식감이 특징", tags: ["흑돼지", "돼지고기", "제주"] },
  { name_ko: "제주 갈치", name_en: "Jeju Hairtail", area_code: "50", category: "수산물", season: ["가을", "겨울"], description: "제주 근해에서 잡힌 은빛 갈치", tags: ["갈치", "생선", "제주"] },
  { name_ko: "제주 녹차", name_en: "Jeju Green Tea", area_code: "50", category: "농산물", season: ["봄", "여름"], description: "제주 오설록 등에서 재배한 녹차", tags: ["녹차", "차", "제주"] },
];

async function main() {
  console.log("🌾 특산품 시드 데이터 삽입 시작...\n");

  // 지역 목록 조회
  const { data: regions, error: regErr } = await supabase
    .from("regions")
    .select("id, area_code");

  if (regErr) {
    console.error("지역 데이터 조회 실패:", regErr.message);
    process.exit(1);
  }

  const regionMap = Object.fromEntries(regions.map((r) => [r.area_code, r.id]));

  // 삽입할 rows 구성
  const rows = SPECIALTIES.map(({ area_code, ...spec }) => ({
    ...spec,
    region_id: regionMap[area_code],
  })).filter((r) => r.region_id); // region_id 없는 항목 제외

  const { error, count } = await supabase
    .from("specialties")
    .upsert(rows, { onConflict: "name_ko,region_id", count: "exact" })
    .select();

  if (error) {
    // upsert conflict 옵션이 없으면 insert로 재시도
    console.warn("upsert 실패, insert로 재시도:", error.message);
    const { error: insErr, data } = await supabase
      .from("specialties")
      .insert(rows)
      .select();
    if (insErr) {
      console.error("insert 실패:", insErr.message);
      process.exit(1);
    }
    console.log(`\n🎉 완료! ${data.length}건 삽입`);
    return;
  }

  console.log(`\n🎉 완료! 총 ${rows.length}건 처리`);
}

main().catch(console.error);
