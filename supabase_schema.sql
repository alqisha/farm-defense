-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Auth)
create table profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  wheat_balance int default 0,
  gold_wheat_balance int default 0,
  current_stage int default 1,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS: Public profiles (read-only for others, editable by owner)
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- 2. USER PLANTS (Persistent State)
create table user_plants (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  grid_index int not null, -- 0 to 24 (5x5 grid)
  plant_level int default 1,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS
alter table user_plants enable row level security;
create policy "Users can see own plants." on user_plants for select using (auth.uid() = user_id);
create policy "Users can modify own plants." on user_plants for all using (auth.uid() = user_id);

-- 3. TRANSFERS (P2P History)
create table transfers (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references profiles(id) not null,
  receiver_id uuid references profiles(id) not null,
  amount int not null check (amount > 0),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS
alter table transfers enable row level security;
create policy "Users can see transfers they are involved in." on transfers for select 
using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- FUNCTION: Handle New User (Trigger)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username, wheat_balance, gold_wheat_balance)
  values (new.id, new.email, 100, 10); -- Start with 100 Wheat, 10 Gold
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
