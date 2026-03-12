-- P2-04: 17개 시도별 대표 특산품 시드 (60개 이상)

-- 서울 (area_code = '1')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '한과', 'Hangwa', id, '가공식품', ARRAY['연중'], '쌀, 꿀, 참기름 등으로 만든 전통 한국 과자', ARRAY['전통과자','명절','선물']
from public.regions where area_code = '1' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '서울 김치', 'Seoul Kimchi', id, '가공식품', ARRAY['연중'], '배추김치를 중심으로 한 서울식 김치', ARRAY['김치','발효','전통']
from public.regions where area_code = '1' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '설렁탕', 'Seolleongtang', id, '가공식품', ARRAY['연중'], '소뼈와 양지를 오래 고아 만든 서울 전통 국밥', ARRAY['소고기','국밥','전통']
from public.regions where area_code = '1' on conflict do nothing;

-- 인천 (area_code = '2')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '인천 꽃게', 'Incheon Blue Crab', id, '수산물', ARRAY['봄','가을'], '서해안에서 잡힌 신선한 꽃게', ARRAY['꽃게','해산물','서해']
from public.regions where area_code = '2' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '강화 순무', 'Ganghwa Turnip', id, '농산물', ARRAY['가을','겨울'], '강화도 특산 순무로 만든 김치', ARRAY['강화','순무','김치']
from public.regions where area_code = '2' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '인천 새우젓', 'Incheon Salted Shrimp', id, '수산물', ARRAY['봄','가을'], '서해 소금으로 절인 새우젓', ARRAY['새우젓','발효','서해']
from public.regions where area_code = '2' on conflict do nothing;

-- 대전 (area_code = '3')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '성심당 튀김소보로', 'Sungsimwdang Fried Soboro', id, '가공식품', ARRAY['연중'], '대전 명물 빵집 성심당의 대표 빵', ARRAY['빵','베이커리','명물']
from public.regions where area_code = '3' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '대전 두부', 'Daejeon Tofu', id, '가공식품', ARRAY['연중'], '두부두루치기로 유명한 대전의 두부 요리', ARRAY['두부','콩','전통']
from public.regions where area_code = '3' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '충청 한우', 'Chungcheong Hanwoo', id, '축산물', ARRAY['연중'], '충청 지역에서 사육한 한우', ARRAY['한우','소고기','축산']
from public.regions where area_code = '3' on conflict do nothing;

-- 대구 (area_code = '4')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '대구 사과', 'Daegu Apple', id, '농산물', ARRAY['가을'], '대구 지역의 달콤한 사과', ARRAY['사과','과일','대구']
from public.regions where area_code = '4' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '동인동 찜갈비', 'Dongin-dong Braised Ribs', id, '축산물', ARRAY['연중'], '대구 동인동에서 유래한 매콤한 찜갈비', ARRAY['갈비','찜','대구']
from public.regions where area_code = '4' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '납작만두', 'Flat Mandu', id, '가공식품', ARRAY['연중'], '대구식 납작한 모양의 만두', ARRAY['만두','분식','대구']
from public.regions where area_code = '4' on conflict do nothing;

-- 광주 (area_code = '5')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '광주 김치', 'Gwangju Kimchi', id, '가공식품', ARRAY['연중'], '전라도식 풍부한 양념의 김치', ARRAY['김치','발효','전라도']
from public.regions where area_code = '5' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '광주 떡갈비', 'Gwangju Tteokgalbi', id, '축산물', ARRAY['연중'], '소고기와 돼지고기를 갈아 만든 떡갈비', ARRAY['갈비','소고기','전라도']
from public.regions where area_code = '5' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '무등산 수박', 'Mudeungsan Watermelon', id, '농산물', ARRAY['여름'], '무등산 기슭에서 재배한 당도 높은 수박', ARRAY['수박','여름과일','광주']
from public.regions where area_code = '5' on conflict do nothing;

-- 부산 (area_code = '6')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '부산 돼지국밥', 'Busan Pork Rice Soup', id, '축산물', ARRAY['연중'], '진한 돼지 뼈 육수로 끓인 부산식 국밥', ARRAY['돼지국밥','국밥','부산']
from public.regions where area_code = '6' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '씨앗호떡', 'Seed Hotteok', id, '가공식품', ARRAY['연중'], '해바라기씨 등 견과류를 넣은 부산 명물 호떡', ARRAY['호떡','길거리음식','부산']
from public.regions where area_code = '6' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '부산 고등어', 'Busan Mackerel', id, '수산물', ARRAY['가을','겨울'], '부산 근해에서 잡힌 신선한 고등어', ARRAY['고등어','생선','부산']
from public.regions where area_code = '6' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '기장 미역', 'Gijang Seaweed', id, '수산물', ARRAY['봄'], '기장 앞바다에서 채취한 참미역', ARRAY['미역','해조류','기장']
from public.regions where area_code = '6' on conflict do nothing;

-- 울산 (area_code = '7')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '언양 불고기', 'Eonyang Bulgogi', id, '축산물', ARRAY['연중'], '언양 방식으로 양념한 한우 불고기', ARRAY['불고기','한우','울산']
from public.regions where area_code = '7' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '울산 고래고기', 'Ulsan Whale Meat', id, '수산물', ARRAY['연중'], '울산 지역의 전통 고래 요리', ARRAY['고래','해산물','울산']
from public.regions where area_code = '7' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '배내골 복숭아', 'Baenaegol Peach', id, '농산물', ARRAY['여름'], '울산 배내골의 달콤한 복숭아', ARRAY['복숭아','여름과일','울산']
from public.regions where area_code = '7' on conflict do nothing;

-- 세종 (area_code = '8')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '세종 복숭아', 'Sejong Peach', id, '농산물', ARRAY['여름'], '세종시 일대에서 재배한 복숭아', ARRAY['복숭아','과일','세종']
from public.regions where area_code = '8' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '전의 한우', 'Jeonui Hanwoo', id, '축산물', ARRAY['연중'], '세종 전의 지역의 한우', ARRAY['한우','소고기','세종']
from public.regions where area_code = '8' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '세종 딸기', 'Sejong Strawberry', id, '농산물', ARRAY['봄'], '세종 지역에서 재배한 딸기', ARRAY['딸기','봄과일','세종']
from public.regions where area_code = '8' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '세종 오이', 'Sejong Cucumber', id, '농산물', ARRAY['여름'], '세종 지역에서 재배한 싱싱한 오이', ARRAY['오이','채소','세종']
from public.regions where area_code = '8' on conflict do nothing;

-- 경기 (area_code = '31')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '이천 쌀', 'Icheon Rice', id, '농산물', ARRAY['가을'], '임금님께 진상한 이천의 고품질 쌀', ARRAY['쌀','이천','임금님진상']
from public.regions where area_code = '31' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '안성 배', 'Anseong Pear', id, '농산물', ARRAY['가을'], '안성 지역에서 생산하는 대형 배', ARRAY['배','과일','안성']
from public.regions where area_code = '31' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '파주 장단콩', 'Paju Jangdan Soybean', id, '농산물', ARRAY['가을'], '파주 장단 지역의 고품질 콩', ARRAY['콩','장단','파주']
from public.regions where area_code = '31' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '포천 이동갈비', 'Pocheon Idong Galbi', id, '축산물', ARRAY['연중'], '포천 이동 지역의 숯불 갈비', ARRAY['갈비','숯불','포천']
from public.regions where area_code = '31' on conflict do nothing;

-- 강원 (area_code = '32')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '횡성 한우', 'Hoengseong Hanwoo', id, '축산물', ARRAY['연중'], '강원도 횡성의 청정 한우', ARRAY['한우','소고기','횡성']
from public.regions where area_code = '32' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '춘천 닭갈비', 'Chuncheon Dak-galbi', id, '축산물', ARRAY['연중'], '고추장 양념으로 볶은 춘천식 닭갈비', ARRAY['닭갈비','닭','춘천']
from public.regions where area_code = '32' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '강릉 커피', 'Gangneung Coffee', id, '가공식품', ARRAY['연중'], '커피 거리로 유명한 강릉의 특산 커피', ARRAY['커피','강릉','카페']
from public.regions where area_code = '32' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '강원 감자', 'Gangwon Potato', id, '농산물', ARRAY['여름'], '강원 고랭지에서 재배한 감자', ARRAY['감자','고랭지','강원']
from public.regions where area_code = '32' on conflict do nothing;

-- 충북 (area_code = '33')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '충주 사과', 'Chungju Apple', id, '농산물', ARRAY['가을'], '충주 지역의 고당도 사과', ARRAY['사과','과일','충주']
from public.regions where area_code = '33' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '보은 대추', 'Boeun Jujube', id, '농산물', ARRAY['가을'], '보은 지역의 달콤한 대추', ARRAY['대추','과일','보은']
from public.regions where area_code = '33' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '옥천 포도', 'Okcheon Grape', id, '농산물', ARRAY['가을'], '옥천 지역에서 재배한 포도', ARRAY['포도','과일','옥천']
from public.regions where area_code = '33' on conflict do nothing;

-- 충남 (area_code = '34')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '광천 새우젓', 'Gwangcheon Salted Shrimp', id, '수산물', ARRAY['봄','가을'], '광천 지역의 전통 새우젓', ARRAY['새우젓','발효','광천']
from public.regions where area_code = '34' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '천안 호두과자', 'Cheonan Walnut Cookie', id, '가공식품', ARRAY['연중'], '천안 명물인 호두 모양의 과자', ARRAY['호두과자','천안','간식']
from public.regions where area_code = '34' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '서산 마늘', 'Seosan Garlic', id, '농산물', ARRAY['여름'], '서산 간척지에서 재배한 마늘', ARRAY['마늘','채소','서산']
from public.regions where area_code = '34' on conflict do nothing;

-- 전북 (area_code = '35')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '전주 비빔밥', 'Jeonju Bibimbap', id, '가공식품', ARRAY['연중'], '다양한 나물과 고추장으로 비빈 전주 대표 음식', ARRAY['비빔밥','전주','전통']
from public.regions where area_code = '35' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '고창 복분자', 'Gochang Bokbunja', id, '농산물', ARRAY['여름'], '고창 지역에서 재배한 복분자', ARRAY['복분자','베리','고창']
from public.regions where area_code = '35' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '남원 추어탕', 'Namwon Chueo-tang', id, '수산물', ARRAY['연중'], '미꾸라지를 넣어 끓인 남원식 추어탕', ARRAY['추어탕','미꾸라지','남원']
from public.regions where area_code = '35' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '익산 쌀', 'Iksan Rice', id, '농산물', ARRAY['가을'], '전북 익산의 고품질 쌀', ARRAY['쌀','곡물','익산']
from public.regions where area_code = '35' on conflict do nothing;

-- 전남 (area_code = '36')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '보성 녹차', 'Boseong Green Tea', id, '농산물', ARRAY['봄','여름'], '보성 녹차밭에서 재배한 고품질 녹차', ARRAY['녹차','차','보성']
from public.regions where area_code = '36' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '여수 갈치', 'Yeosu Hairtail', id, '수산물', ARRAY['가을','겨울'], '여수 근해에서 잡힌 은빛 갈치', ARRAY['갈치','생선','여수']
from public.regions where area_code = '36' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '담양 대나무', 'Damyang Bamboo', id, '공예품', ARRAY['연중'], '담양의 대나무로 만든 전통 공예품', ARRAY['대나무','공예','담양']
from public.regions where area_code = '36' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '나주 배', 'Naju Pear', id, '농산물', ARRAY['가을'], '나주 지역에서 생산하는 대형 배', ARRAY['배','과일','나주']
from public.regions where area_code = '36' on conflict do nothing;

-- 경북 (area_code = '37')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '안동 찜닭', 'Andong Jjimdak', id, '축산물', ARRAY['연중'], '간장 양념으로 조린 안동식 찜닭', ARRAY['찜닭','닭','안동']
from public.regions where area_code = '37' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '영덕 대게', 'Yeongdeok Snow Crab', id, '수산물', ARRAY['겨울','봄'], '영덕 앞바다에서 잡힌 대게', ARRAY['대게','게','영덕']
from public.regions where area_code = '37' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '청도 복숭아', 'Cheongdo Peach', id, '농산물', ARRAY['여름'], '청도 지역의 달콤한 복숭아', ARRAY['복숭아','과일','청도']
from public.regions where area_code = '37' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '의성 마늘', 'Uiseong Garlic', id, '농산물', ARRAY['여름'], '한국 마늘의 본향 의성의 마늘', ARRAY['마늘','채소','의성']
from public.regions where area_code = '37' on conflict do nothing;

-- 경남 (area_code = '38')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '통영 굴', 'Tongyeong Oyster', id, '수산물', ARRAY['겨울'], '통영 청정 바다에서 양식한 굴', ARRAY['굴','해산물','통영']
from public.regions where area_code = '38' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '남해 마늘', 'Namhae Garlic', id, '농산물', ARRAY['여름'], '남해 지역에서 재배한 질 좋은 마늘', ARRAY['마늘','채소','남해']
from public.regions where area_code = '38' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '하동 녹차', 'Hadong Green Tea', id, '농산물', ARRAY['봄','여름'], '지리산 자락 하동의 야생 녹차', ARRAY['녹차','차','하동']
from public.regions where area_code = '38' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '진주 냉면', 'Jinju Naengmyeon', id, '가공식품', ARRAY['연중'], '해물 육수와 선지를 넣은 진주 냉면', ARRAY['냉면','진주','전통']
from public.regions where area_code = '38' on conflict do nothing;

-- 제주 (area_code = '39')
insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '한라봉', 'Hallabong', id, '농산물', ARRAY['겨울','봄'], '제주 특산 감귤류로 당도가 높고 향이 풍부한 과일', ARRAY['감귤','제주','비타민']
from public.regions where area_code = '39' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '제주 흑돼지', 'Jeju Black Pork', id, '축산물', ARRAY['연중'], '제주 재래종 흑돼지로 쫄깃한 식감이 특징', ARRAY['흑돼지','돼지고기','제주']
from public.regions where area_code = '39' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '제주 갈치', 'Jeju Hairtail', id, '수산물', ARRAY['가을','겨울'], '제주 근해에서 잡힌 은빛 갈치', ARRAY['갈치','생선','제주']
from public.regions where area_code = '39' on conflict do nothing;

insert into public.specialties (name_ko, name_en, region_id, category, season, description, tags)
select '제주 녹차', 'Jeju Green Tea', id, '농산물', ARRAY['봄','여름'], '제주 오설록 등에서 재배한 녹차', ARRAY['녹차','차','제주']
from public.regions where area_code = '39' on conflict do nothing;
