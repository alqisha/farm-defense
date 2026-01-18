-- 1. Helper function to mask emails
create or replace function mask_username(name text) returns text as $$
begin
  if name like '%@%' then
    return split_part(name, '@', 1) || '***';
  else
    return name;
  end if;
end;
$$ language plpgsql immutable;

-- 2. Leaderboard Function (Secure)
create or replace function get_leaderboard(limit_count int default 50)
returns table (
  username text,
  stage int,
  wave int,
  gold int
) as $$
begin
  return query
  select 
    mask_username(coalesce(p.telegram_username, p.username, 'Farmer')) as username,
    p.current_stage as stage,
    p.current_wave as wave,
    p.gold_wheat_balance as gold
  from profiles p
  order by p.current_stage desc, p.current_wave desc, p.gold_wheat_balance desc
  limit limit_count;
end;
$$ language plpgsql security definer;

-- 3. Recent Transfers Function (Secure)
create or replace function get_recent_receivers(sender_uuid uuid, limit_count int default 5)
returns table (
  receiver_id uuid,
  username text,
  last_transfer_at timestamp with time zone
) as $$
begin
  return query
  select distinct on (t.receiver_id)
    t.receiver_id,
    mask_username(coalesce(p.telegram_username, p.username, 'Farmer')) as username,
    max(t.created_at) as last_transfer_at
  from transfers t
  join profiles p on p.id = t.receiver_id
  where t.sender_id = sender_uuid
  group by t.receiver_id, p.telegram_username, p.username
  order by t.receiver_id, last_transfer_at desc
  limit limit_count;
end;
$$ language plpgsql security definer;
