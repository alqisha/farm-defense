-- Function to safely transfer Golden Wheat between users
create or replace function transfer_gold_wheat(
  receiver_username text, 
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
begin
  -- Get Sender ID (current user)
  sender_id := auth.uid();
  
  -- Check negative amount
  if amount <= 0 then
    return json_build_object('success', false, 'message', 'Amount must be positive');
  end if;

  -- Get Sender Balance
  select gold_wheat_balance into sender_balance from profiles where id = sender_id;
  
  if sender_balance < amount then
    return json_build_object('success', false, 'message', 'Insufficient balance');
  end if;

  -- Get Receiver ID
  select id into receiver_id from profiles where username = receiver_username;
  
  if receiver_id is null then
    return json_build_object('success', false, 'message', 'User not found');
  end if;
  
  if receiver_id = sender_id then
    return json_build_object('success', false, 'message', 'Cannot send to self');
  end if;

  -- Perform Transfer
  update profiles set gold_wheat_balance = gold_wheat_balance - amount where id = sender_id;
  update profiles set gold_wheat_balance = gold_wheat_balance + amount where id = receiver_id;
  
  -- Record Transaction
  insert into transfers (sender_id, receiver_id, amount) values (sender_id, receiver_id, amount);

  return json_build_object('success', true, 'message', 'Transfer successful');
end;
$$;
