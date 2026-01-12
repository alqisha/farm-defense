-- Add current_wave column to profiles table
alter table profiles add column current_wave int default 1;
