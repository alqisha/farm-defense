-- Function to securely spend gold wheat
create or replace function spend_gold_wheat(amount int)
returns jsonb as $$
declare
  user_uuid uuid;
  current_balance int;
begin
  user_uuid := auth.uid();
  
  -- Check Balance
  select gold_wheat_balance into current_balance from profiles where id = user_uuid;
  
  if current_balance < amount then
    return jsonb_build_object('success', false, 'error', 'Insufficient funds');
  end if;

  -- Deduct Balance
  update profiles 
  set gold_wheat_balance = gold_wheat_balance - amount 
  where id = user_uuid;

  return jsonb_build_object('success', true, 'new_balance', current_balance - amount);
end;
$$ language plpgsql security definer;
