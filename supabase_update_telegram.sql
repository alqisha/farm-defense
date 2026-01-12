-- 1. Add telegram_username to profiles if not exists
alter table profiles add column if not exists telegram_username text unique;

-- 2. Drop old function to allow parameter rename
drop function if exists transfer_gold_wheat(text, int);

-- 3. Update transfer function to find by email OR telegram_username
create or replace function transfer_gold_wheat(
  receiver_identity text, -- Can be email (username) or @username (telegram)
  amount int
) 
returns json 
language plpgsql 
security definer 
as $$
declare
  sender_id uuid;
  receiver_id uuid;
  sender_balance int;
  clean_username text;
begin
  sender_id := auth.uid();
  
  -- Validation
  if amount <= 0 then return json_build_object('success', false, 'message', 'Invalid amount'); end if;

  -- Check Balance
  select gold_wheat_balance into sender_balance from profiles where id = sender_id;
  if sender_balance < amount then return json_build_object('success', false, 'message', 'Insufficient funds'); end if;

  -- Resolve Receiver
  if substring(receiver_identity from 1 for 1) = '@' then
     -- Search by Telegram Username (remove @)
     clean_username := substring(receiver_identity from 2); 
     select id into receiver_id from profiles where telegram_username = clean_username;
  else
     -- Search by Email/Username
     select id into receiver_id from profiles where username = receiver_identity;
  end if;

  if receiver_id is null then return json_build_object('success', false, 'message', 'User not found'); end if;
  if receiver_id = sender_id then return json_build_object('success', false, 'message', 'Cannot send to self'); end if;

  -- Transfer
  update profiles set gold_wheat_balance = gold_wheat_balance - amount where id = sender_id;
  update profiles set gold_wheat_balance = gold_wheat_balance + amount where id = receiver_id;
  
  insert into transfers (sender_id, receiver_id, amount) values (sender_id, receiver_id, amount);

  return json_build_object('success', true, 'message', 'Transfer successful');
end;
$$;
