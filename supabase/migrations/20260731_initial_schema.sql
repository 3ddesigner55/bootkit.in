-- BootKiT: production database foundation for Supabase/PostgreSQL.
-- Run this file in the Supabase SQL editor before connecting the app.

create type public.app_role as enum ('OWNER', 'ADMIN', 'CUSTOMER');
create type public.order_status as enum ('PLACED', 'CONFIRMED', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null unique,
  phone text not null default '',
  role public.app_role not null default 'CUSTOMER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  brand text not null,
  category_slug text not null,
  image_url text,
  fallback_icon text not null default '📦',
  unit_label text not null,
  unit_value text not null,
  mrp numeric(12, 2) not null check (mrp >= 0),
  price numeric(12, 2) not null check (price >= 0 and price <= mrp),
  stock integer not null default 0 check (stock >= 0),
  rating numeric(2, 1) not null default 0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  delivery_minutes integer not null default 15 check (delivery_minutes > 0),
  featured boolean not null default false,
  bestseller boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.profiles(id),
  status public.order_status not null default 'PLACED',
  payment_status text not null default 'PENDING',
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  address jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  total_price numeric(12, 2) not null check (total_price >= 0)
);

create index orders_customer_id_created_at_idx on public.orders(customer_id, created_at desc);
create index products_category_active_idx on public.products(category_slug, active);

create or replace function public.current_user_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email, coalesce(new.raw_user_meta_data->>'phone', ''));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "profiles: users read self; staff read all" on public.profiles for select to authenticated
using (id = auth.uid() or public.current_user_role() in ('OWNER', 'ADMIN'));
create policy "profiles: users update self without role change" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role = public.current_user_role());
create policy "profiles: owner updates roles" on public.profiles for update to authenticated using (public.current_user_role() = 'OWNER') with check (public.current_user_role() = 'OWNER');

create policy "products: anyone reads active" on public.products for select using (active or public.current_user_role() in ('OWNER', 'ADMIN'));
create policy "products: staff manages" on public.products for all to authenticated using (public.current_user_role() in ('OWNER', 'ADMIN')) with check (public.current_user_role() in ('OWNER', 'ADMIN'));

create policy "orders: customer reads own; staff reads all" on public.orders for select to authenticated using (customer_id = auth.uid() or public.current_user_role() in ('OWNER', 'ADMIN'));
create policy "orders: customer creates own" on public.orders for insert to authenticated with check (customer_id = auth.uid());
create policy "orders: staff updates" on public.orders for update to authenticated using (public.current_user_role() in ('OWNER', 'ADMIN')) with check (public.current_user_role() in ('OWNER', 'ADMIN'));
create policy "order items: order visibility" on public.order_items for select to authenticated using (exists (select 1 from public.orders where orders.id = order_items.order_id and (orders.customer_id = auth.uid() or public.current_user_role() in ('OWNER', 'ADMIN'))));
create policy "order items: customer creates own" on public.order_items for insert to authenticated with check (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.customer_id = auth.uid()));

-- After your first account signs up, promote it exactly once:
-- update public.profiles set role = 'OWNER' where id = '<your-auth-user-uuid>';
