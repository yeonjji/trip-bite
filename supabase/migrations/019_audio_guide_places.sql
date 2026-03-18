-- 편한여행: 관광지 오디오 가이드 정보 (한국관광공사_관광지 오디오 가이드정보_GW)

create table if not exists public.audio_guide_places (
  id               uuid primary key default gen_random_uuid(),
  content_id       text not null unique,
  content_type_id  text,
  title            text not null,
  addr1            text not null default '',
  addr2            text,
  area_code        text references public.regions(area_code),
  sigungu_code     text,
  location         geography(point, 4326),
  mapx             numeric(11, 7),
  mapy             numeric(10, 7),
  first_image      text,
  first_image2     text,
  tel              text,
  homepage         text,
  overview         text,
  -- 오디오 가이드 전용 필드
  audio_url        text,           -- 오디오 가이드 파일 URL
  audio_script     text,           -- 오디오 스크립트 (텍스트 내용)
  audio_lang       text default 'ko',  -- 언어 코드 (ko, en, zh, ja 등)
  audio_duration   int,            -- 재생 시간 (초)
  rating_avg       numeric(3,1) not null default 0,
  rating_count     int not null default 0,
  cached_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger set_audio_guide_places_updated_at
  before update on public.audio_guide_places
  for each row execute function public.set_updated_at();

create index if not exists audio_guide_places_area_code_idx on public.audio_guide_places(area_code);
create index if not exists audio_guide_places_sigungu_idx on public.audio_guide_places(sigungu_code);
create index if not exists audio_guide_places_rating_idx on public.audio_guide_places(rating_avg desc);
create index if not exists audio_guide_places_location_idx on public.audio_guide_places using gist(location);

alter table public.audio_guide_places enable row level security;
create policy "Anyone can read audio_guide_places"
  on public.audio_guide_places for select using (true);
