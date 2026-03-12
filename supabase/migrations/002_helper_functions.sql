-- P0-07: 공통 SQL 함수

-- 1. updated_at 자동 갱신 트리거 함수
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. 평점 집계 함수 (리뷰 작성/삭제 시 호출)
create or replace function public.update_rating_summary(
  p_target_type text,
  p_target_id   text
)
returns void
language plpgsql
as $$
declare
  v_avg  numeric;
  v_count integer;
begin
  select
    round(avg(rating)::numeric, 1),
    count(*)
  into v_avg, v_count
  from public.reviews
  where target_type = p_target_type
    and target_id   = p_target_id
    and is_deleted  = false;

  if p_target_type = 'destination' then
    update public.destinations
    set rating_avg   = coalesce(v_avg, 0),
        rating_count = coalesce(v_count, 0),
        updated_at   = now()
    where content_id = p_target_id;

  elsif p_target_type = 'camping' then
    update public.camping_sites
    set rating_avg   = coalesce(v_avg, 0),
        rating_count = coalesce(v_count, 0),
        updated_at   = now()
    where content_id = p_target_id;
  end if;
end;
$$;
