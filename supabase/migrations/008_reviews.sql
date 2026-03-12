-- P1-11: reviews 테이블 마이그레이션 + 평점 집계 트리거

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('destination', 'camping')),
  target_id   text not null,
  rating      smallint not null check (rating between 1 and 5),
  content     text,
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create trigger set_reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- 평점 집계 트리거 함수
create or replace function public.on_review_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.update_rating_summary(old.target_type, old.target_id);
  else
    perform public.update_rating_summary(new.target_type, new.target_id);
  end if;
  return coalesce(new, old);
end;
$$;

-- 리뷰 INSERT/UPDATE/DELETE 시 평점 집계 갱신
create trigger reviews_rating_update
  after insert or update or delete on public.reviews
  for each row execute function public.on_review_change();

-- 인덱스
create index if not exists reviews_target_idx on public.reviews(target_type, target_id);
create index if not exists reviews_user_idx on public.reviews(user_id);

-- RLS
alter table public.reviews enable row level security;
create policy "Anyone can read reviews"
  on public.reviews for select using (is_deleted = false);
create policy "Authenticated users can create reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);
create policy "Users can update own reviews"
  on public.reviews for update
  using (auth.uid() = user_id);
