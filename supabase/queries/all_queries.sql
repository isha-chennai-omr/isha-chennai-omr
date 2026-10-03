create extension if not exists pgcrypto;

create table public.links (
    slug text primary key,
    name text not null,
    landing_url text not null,
    image_path text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.programs (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    start_date date not null,
    end_date date not null,
    start_time time not null,
    end_time time not null,
    description text,
    link text,
    link_ref text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index links_created_at_idx
    on public.links(created_at desc);

create index programs_start_date_idx
    on public.programs(start_date);

create table public.admin_users (
    user_id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create policy "Admins can read their own admin record"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

alter table public.links enable row level security;
alter table public.programs enable row level security;
alter table public.admin_users enable row level security;

-- ============================================
-- LINKS
-- ============================================

create policy "Public can read links"
on public.links
for select
to anon, authenticated
using (true);


create policy "Admins can create links"
on public.links
for insert
to authenticated
with check (
    exists (
        select 1
        from public.admin_users
        where user_id = auth.uid()
    )
);


create policy "Admins can update links"
on public.links
for update
to authenticated
using (
    exists (
        select 1
        from public.admin_users
        where user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.admin_users
        where user_id = auth.uid()
    )
);


create policy "Admins can delete links"
on public.links
for delete
to authenticated
using (
    exists (
        select 1
        from public.admin_users
        where user_id = auth.uid()
    )
);


-- ============================================
-- PROGRAMS
-- ============================================

create policy "Public can read programs"
on public.programs
for select
to anon, authenticated
using (true);


create policy "Admins can create programs"
on public.programs
for insert
to authenticated
with check (
    exists (
        select 1
        from public.admin_users
        where user_id = auth.uid()
    )
);


create policy "Admins can update programs"
on public.programs
for update
to authenticated
using (
    exists (
        select 1
        from public.admin_users
        where user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.admin_users
        where user_id = auth.uid()
    )
);


create policy "Admins can delete programs"
on public.programs
for delete
to authenticated
using (
    exists (
        select 1
        from public.admin_users
        where user_id = auth.uid()
    )
);


-- ============================================
-- ADMIN USERS
-- ============================================

create policy "Users can read their own admin record"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());


-- ============================================
-- Storage Policies
-- ============================================

create policy "Public can view preview images"
on storage.objects
for select
to public
using (
    bucket_id = 'preview-images'
);


create policy "Admins can upload preview images"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'preview-images'
    and exists (
        select 1
        from public.admin_users
        where user_id = auth.uid()
    )
);


create policy "Admins can update preview images"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'preview-images'
    and exists (
        select 1
        from public.admin_users
        where user_id = auth.uid()
    )
)
with check (
    bucket_id = 'preview-images'
    and exists (
        select 1
        from public.admin_users
        where user_id = auth.uid()
    )
);


create policy "Admins can delete preview images"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'preview-images'
    and exists (
        select 1
        from public.admin_users
        where user_id = auth.uid()
    )
);

