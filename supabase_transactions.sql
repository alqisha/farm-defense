-- 1. Create Transactions Table
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references profiles(id),
  receiver_id uuid references profiles(id),
  amount int not null,
  type text not null, -- 'TRANSFER', 'DEPOSIT', 'SPEND', 'REFERRAL'
  description text,
  created_at timestamp with time zone default now()
);

-- Enable RLS (Read only for users involved, Insert only via functions)
alter table transactions enable row level security;
create policy "Users can see their own transactions" on transactions
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- 2. P2P Transfer Function
create or replace function transfer_gold(receiver_id uuid, amount int)
returns jsonb as $$
declare
  sender_id uuid;
  sender_balance int;
begin
  sender_id := auth.uid();
  
  if sender_id = receiver_id then
    return jsonb_build_object('success', false, 'error', 'Cannot transfer to self');
  end if;
  
  if amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'Invalid amount');
  end if;

  -- Check Sender Balance
  select gold_wheat_balance into sender_balance from profiles where id = sender_id;
  
  if sender_balance < amount then
    return jsonb_build_object('success', false, 'error', 'Insufficient funds');
  end if;

  -- Deduct from Sender
  update profiles set gold_wheat_balance = gold_wheat_balance - amount where id = sender_id;
  
  -- Add to Receiver
  update profiles set gold_wheat_balance = gold_wheat_balance + amount where id = receiver_id;

  -- Log Transaction
  insert into transactions (sender_id, receiver_id, amount, type, description)
  values (sender_id, receiver_id, amount, 'TRANSFER', 'P2P Gift');

  return jsonb_build_object('success', true, 'new_balance', sender_balance - amount);
end;
$$ language plpgsql security definer;

-- 3. Update Existing Functions with Logging

-- Update buy_item
create or replace function buy_item(item_id text)
returns jsonb as $$
declare
  user_uuid uuid;
  amount_to_add int;
begin
  user_uuid := auth.uid();
  
  -- Define prices (Simplified for brevity, matches ShopDialog.tsx)
  if item_id = 'small' then amount_to_add := 100;
  elsif item_id = 'pack' then amount_to_add := 219;
  elsif item_id = 'big_pack' then amount_to_add := 559;
  elsif item_id = 'sack' then amount_to_add := 1250;
  elsif item_id = 'cart' then amount_to_add := 2900;
  else return '{"success": false, "error": "Invalid item"}'::jsonb;
  end if;

  update profiles set gold_wheat_balance = gold_wheat_balance + amount_to_add where id = user_uuid;

  -- LOG
  insert into transactions (receiver_id, amount, type, description)
  values (user_uuid, amount_to_add, 'DEPOSIT', 'Purchased ' || item_id);

  return jsonb_build_object('success', true, 'added', amount_to_add, 'new_balance', (select gold_wheat_balance from profiles where id = user_uuid));
end;
$$ language plpgsql security definer;

-- Update spend_gold_wheat
create or replace function spend_gold_wheat(amount int)
returns jsonb as $$
declare
  user_uuid uuid;
  current_balance int;
begin
  user_uuid := auth.uid();
  select gold_wheat_balance into current_balance from profiles where id = user_uuid;
  
  if current_balance < amount then
    return jsonb_build_object('success', false, 'error', 'Insufficient funds');
  end if;

  update profiles set gold_wheat_balance = gold_wheat_balance - amount where id = user_uuid;

  -- LOG
  insert into transactions (sender_id, amount, type, description)
  values (user_uuid, amount, 'SPEND', 'Shop Purchase');

  return jsonb_build_object('success', true, 'new_balance', current_balance - amount);
end;
$$ language plpgsql security definer;

-- Update process_referral
create or replace function process_referral(referrer_id uuid)
returns text as $$
declare
  new_user_uuid uuid;
  already_referred uuid;
begin
  new_user_uuid := auth.uid();
  select referred_by into already_referred from profiles where id = new_user_uuid;
  
  if already_referred is not null then return 'Already referred'; end if;
  if new_user_uuid = referrer_id then return 'Cannot refer self'; end if;

  update profiles set referred_by = referrer_id where id = new_user_uuid;
  
  -- Bonus & Log for Referrer
  update profiles set gold_wheat_balance = gold_wheat_balance + 100 where id = referrer_id;
  insert into transactions (receiver_id, amount, type, description) values (referrer_id, 100, 'REFERRAL', 'Referral Bonus');
  
  -- Bonus & Log for New User
  update profiles set gold_wheat_balance = gold_wheat_balance + 50 where id = new_user_uuid;
  insert into transactions (receiver_id, amount, type, description) values (new_user_uuid, 50, 'REFERRAL', 'Welcome Bonus');

  return 'Success';
end;
$$ language plpgsql security definer;
