-- 1. Add new columns to profiles
alter table profiles 
add column if not exists last_seen_at timestamp with time zone default now(),
add column if not exists referred_by uuid references profiles(id),
add column if not exists referral_bonus_claimed boolean default false;

-- 2. Secure Buy Function (RPC)
-- Prevents client from directly editing gold_wheat_balance
create or replace function buy_item(item_id text)
returns jsonb as $$
declare
  user_uuid uuid;
  price int;
  amount_to_add int;
  bonus_amount int;
  current_gold int;
begin
  user_uuid := auth.uid();
  
  -- Define prices (Hardcoded for simplicity, ideally in a table)
  if item_id = 'small' then
    price := 0; -- Should be real $, but we simulate purchase success after mock payment
    amount_to_add := 100;
  elsif item_id = 'pack' then
    amount_to_add := 219; -- 200 + 19
  elsif item_id = 'big_pack' then
    amount_to_add := 559; -- 500 + 59
  elsif item_id = 'sack' then
    amount_to_add := 1250; -- 1100 + 150
  elsif item_id = 'cart' then
    amount_to_add := 2900; -- 2500 + 400
  else
    return '{"success": false, "error": "Invalid item"}'::jsonb;
  end if;

  -- Update Balance
  update profiles 
  set gold_wheat_balance = gold_wheat_balance + amount_to_add
  where id = user_uuid;

  return jsonb_build_object(
    'success', true, 
    'added', amount_to_add,
    'new_balance', (select gold_wheat_balance from profiles where id = user_uuid)
  );
end;
$$ language plpgsql security definer;

-- 3. Offline Income Function
-- Calculates earning based on time difference
create or replace function claim_offline_income(production_rate_per_sec int)
returns int as $$
declare
  user_uuid uuid;
  last_seen timestamp with time zone;
  seconds_diff int;
  earned_wheat int;
begin
  user_uuid := auth.uid();
  
  select last_seen_at into last_seen from profiles where id = user_uuid;
  
  if last_seen is null then
    -- First time or migration, just set now
    update profiles set last_seen_at = now() where id = user_uuid;
    return 0;
  end if;

  -- Calculate diff in seconds
  seconds_diff := extract(epoch from (now() - last_seen))::int;
  
  -- Cap at 8 hours (28800 seconds)
  if seconds_diff > 28800 then
    seconds_diff := 28800;
  end if;
  
  if seconds_diff < 60 then
    -- Less than a minute, ignore
    update profiles set last_seen_at = now() where id = user_uuid;
    return 0;
  end if;

  earned_wheat := seconds_diff * production_rate_per_sec;

  -- Update profile
  update profiles 
  set wheat_balance = wheat_balance + earned_wheat,
      last_seen_at = now()
  where id = user_uuid;

  return earned_wheat;
end;
$$ language plpgsql security definer;

-- 4. Referral Processing
create or replace function process_referral(referrer_id uuid)
returns text as $$
declare
  new_user_uuid uuid;
  already_referred uuid;
begin
  new_user_uuid := auth.uid();
  
  -- Check if already has referrer
  select referred_by into already_referred from profiles where id = new_user_uuid;
  
  if already_referred is not null then
    return 'Already referred';
  end if;
  
  if new_user_uuid = referrer_id then
    return 'Cannot refer self';
  end if;

  -- Set referrer
  update profiles set referred_by = referrer_id where id = new_user_uuid;
  
  -- Bonus for Referrer (e.g. 100 Gold)
  update profiles set gold_wheat_balance = gold_wheat_balance + 100 where id = referrer_id;
  
  -- Bonus for New User (e.g. 50 Gold)
  update profiles set gold_wheat_balance = gold_wheat_balance + 50 where id = new_user_uuid;

  return 'Success';
end;
$$ language plpgsql security definer;
