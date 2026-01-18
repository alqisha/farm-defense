-- Update Offline Income Function (V3 - Seconds Based)
-- Logic: (Wheat/sec * Seconds) * (1 + Stage * 0.5)
-- Min: 60 seconds. Max: 4 hours (14400 seconds).

create or replace function claim_offline_income_v2(production_rate_per_sec int)
returns jsonb as $$
declare
  user_uuid uuid;
  last_seen timestamp with time zone;
  seconds_diff int;
  base_earned int;
  final_earned int;
  current_stage int;
  multiplier numeric;
  display_hours numeric;
begin
  user_uuid := auth.uid();
  select last_seen_at, current_stage into last_seen, current_stage from profiles where id = user_uuid;
  
  if current_stage is null then current_stage := 1; end if;

  -- First time or error
  if last_seen is null then
    update profiles set last_seen_at = now() where id = user_uuid;
    return jsonb_build_object('earned', 0);
  end if;

  -- Time Diff
  seconds_diff := extract(epoch from (now() - last_seen))::int;
  
  -- Min 1 minute (60 seconds) for testing and fairness
  if seconds_diff < 60 then
    -- Don't reset time if it's just a refresh
    -- But to prevent abuse, maybe we should? 
    -- Let's just update timestamp to now so they can't accum 59s repeatedly
    update profiles set last_seen_at = now() where id = user_uuid;
    return jsonb_build_object('earned', 0);
  end if;

  -- Max 4 hours (14400s)
  if seconds_diff > 14400 then
    seconds_diff := 14400;
  end if;

  -- Calculation
  base_earned := production_rate_per_sec * seconds_diff;
  
  -- Multiplier
  multiplier := 1 + (current_stage * 0.5);
  final_earned := floor(base_earned * multiplier);

  -- Display Hours (for UI)
  display_hours := round((seconds_diff::numeric / 3600.0), 2);

  -- Update Balance: REMOVED. Client will claim it.
  -- Only update last_seen_at to prevent double claiming for the same period.
  update profiles 
  set last_seen_at = now()
  where id = user_uuid;

  return jsonb_build_object(
    'earned', final_earned, 
    'hours', display_hours, 
    'multiplier', multiplier
  );
end;
$$ language plpgsql security definer;
