-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (synced with auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  avatar_url text,
  theme_preference text default 'system' check (theme_preference in ('light', 'dark', 'night', 'system')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Trigger to automatically populate profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Projects Table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  auth_user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text default '',
  status text default 'active' not null,
  link_share_permission text default 'block' check (link_share_permission in ('block', 'view', 'comment', 'edit')),
  "order" integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  deleted_at timestamptz
);

-- 3. Sections Table (parent_section_id === null -> Section; else Subsection)
create table if not exists public.sections (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  parent_section_id uuid references public.sections(id) on delete cascade,
  title text not null,
  description text default '',
  status text default 'active' not null,
  "order" integer default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  deleted_at timestamptz
);

-- 4. Tasks Table (parent_task_id === null -> Task; else Subtask)
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  section_id uuid references public.sections(id) on delete cascade not null,
  parent_task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  description text default '',
  attachment_paths jsonb default '[]'::jsonb not null,
  "order" integer default 0 not null,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  uploaded_at timestamptz,
  deleted_at timestamptz
);

-- 5. Comments Table
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  auth_user_id uuid references auth.users(id) on delete cascade not null,
  comment text not null,
  attachment_paths jsonb default '[]'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  uploaded_at timestamptz,
  deleted_at timestamptz
);

-- 6. Invitations Table
create table if not exists public.invitations (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  email text not null,
  permission text default 'view' check (permission in ('view', 'comment', 'edit')),
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  deleted_at timestamptz
);

-- Performance Indexes
create index if not exists idx_projects_owner on public.projects(auth_user_id) where deleted_at is null;
create index if not exists idx_sections_project on public.sections(project_id, parent_section_id) where deleted_at is null;
create index if not exists idx_tasks_section on public.tasks(section_id, parent_task_id) where deleted_at is null;
create index if not exists idx_comments_task on public.comments(task_id) where deleted_at is null;
create index if not exists idx_invitations_email on public.invitations(email, status) where deleted_at is null;
create index if not exists idx_invitations_project on public.invitations(project_id) where deleted_at is null;

-- Helper Access Control Function
create or replace function public.has_project_access(_project_id uuid, _min_permission text default 'view')
returns boolean as $$
declare
  _owner uuid;
  _link_perm text;
  _invite_perm text;
  _user_email text;
begin
  select auth_user_id, link_share_permission into _owner, _link_perm
  from public.projects where id = _project_id and deleted_at is null;

  if _owner is null then
    return false;
  end if;

  -- 1. Project Owner has full access
  if auth.uid() is not null and _owner = auth.uid() then
    return true;
  end if;

  -- 2. Check Accepted Invitation
  _user_email := auth.jwt()->>'email';
  if _user_email is not null then
    select permission into _invite_perm
    from public.invitations
    where project_id = _project_id
      and lower(email) = lower(_user_email)
      and status = 'accepted'
      and deleted_at is null
    limit 1;

    if _invite_perm is not null then
      if _min_permission = 'view' then return true; end if;
      if _min_permission = 'comment' and _invite_perm in ('comment', 'edit') then return true; end if;
      if _min_permission = 'edit' and _invite_perm = 'edit' then return true; end if;
    end if;
  end if;

  -- 3. Check Link Sharing
  if _link_perm is not null and _link_perm != 'block' then
    if _min_permission = 'view' and _link_perm in ('view', 'comment', 'edit') then
      return true;
    end if;

    if auth.uid() is not null then
      if _min_permission = 'comment' and _link_perm in ('comment', 'edit') then
        return true;
      end if;
      if _min_permission = 'edit' and _link_perm = 'edit' then
        return true;
      end if;
    end if;
  end if;

  return false;
end;
$$ language plpgsql security definer set search_path = public;

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.sections enable row level security;
alter table public.tasks enable row level security;
alter table public.comments enable row level security;
alter table public.invitations enable row level security;

-- Profiles Policies
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Projects Policies
create policy "Projects view access"
  on public.projects for select using (
    deleted_at is null and (
      auth_user_id = auth.uid()
      or link_share_permission != 'block'
      or public.has_project_access(id, 'view')
    )
  );

create policy "Projects insert access"
  on public.projects for insert to authenticated with check (
    auth.uid() = auth_user_id
  );

create policy "Projects update access"
  on public.projects for update to authenticated using (
    auth.uid() = auth_user_id or public.has_project_access(id, 'edit')
  );

create policy "Projects delete access"
  on public.projects for delete to authenticated using (
    auth.uid() = auth_user_id
  );

-- Sections Policies
create policy "Sections view access"
  on public.sections for select using (
    deleted_at is null and public.has_project_access(project_id, 'view')
  );

create policy "Sections insert access"
  on public.sections for insert to authenticated with check (
    public.has_project_access(project_id, 'edit')
  );

create policy "Sections update access"
  on public.sections for update to authenticated using (
    public.has_project_access(project_id, 'edit')
  );

create policy "Sections delete access"
  on public.sections for delete to authenticated using (
    public.has_project_access(project_id, 'edit')
  );

-- Tasks Policies
create policy "Tasks view access"
  on public.tasks for select using (
    deleted_at is null and exists (
      select 1 from public.sections s
      where s.id = tasks.section_id
        and s.deleted_at is null
        and public.has_project_access(s.project_id, 'view')
    )
  );

create policy "Tasks insert access"
  on public.tasks for insert to authenticated with check (
    exists (
      select 1 from public.sections s
      where s.id = tasks.section_id
        and s.deleted_at is null
        and public.has_project_access(s.project_id, 'edit')
    )
  );

create policy "Tasks update access"
  on public.tasks for update to authenticated using (
    exists (
      select 1 from public.sections s
      where s.id = tasks.section_id
        and s.deleted_at is null
        and public.has_project_access(s.project_id, 'edit')
    )
  );

create policy "Tasks delete access"
  on public.tasks for delete to authenticated using (
    exists (
      select 1 from public.sections s
      where s.id = tasks.section_id
        and s.deleted_at is null
        and public.has_project_access(s.project_id, 'edit')
    )
  );

-- Comments Policies
create policy "Comments view access"
  on public.comments for select using (
    deleted_at is null and exists (
      select 1 from public.tasks t
      join public.sections s on s.id = t.section_id
      where t.id = comments.task_id
        and t.deleted_at is null
        and s.deleted_at is null
        and public.has_project_access(s.project_id, 'view')
    )
  );

create policy "Comments insert access"
  on public.comments for insert to authenticated with check (
    auth.uid() = auth_user_id and exists (
      select 1 from public.tasks t
      join public.sections s on s.id = t.section_id
      where t.id = comments.task_id
        and t.deleted_at is null
        and s.deleted_at is null
        and public.has_project_access(s.project_id, 'comment')
    )
  );

create policy "Comments delete own access"
  on public.comments for delete to authenticated using (
    auth.uid() = auth_user_id
  );

-- Invitations Policies
create policy "Invitations view access"
  on public.invitations for select using (
    deleted_at is null and (
      exists (
        select 1 from public.projects p
        where p.id = invitations.project_id
          and p.deleted_at is null
          and (
            p.auth_user_id = auth.uid()
            or public.has_project_access(p.id, 'edit')
          )
      )
      or (auth.uid() is not null and lower(email) = lower(coalesce(auth.jwt()->>'email', '')))
    )
  );

create policy "Invitations insert access"
  on public.invitations for insert to authenticated with check (
    exists (
      select 1 from public.projects p
      where p.id = invitations.project_id
        and p.deleted_at is null
        and (
          p.auth_user_id = auth.uid()
          or public.has_project_access(p.id, 'edit')
        )
    )
  );

create policy "Invitations update access"
  on public.invitations for update to authenticated using (
    exists (
      select 1 from public.projects p
      where p.id = invitations.project_id
        and p.deleted_at is null
        and (
          p.auth_user_id = auth.uid()
          or public.has_project_access(p.id, 'edit')
        )
    )
    or (auth.uid() is not null and lower(email) = lower(coalesce(auth.jwt()->>'email', '')))
  );

create policy "Invitations delete access"
  on public.invitations for delete to authenticated using (
    exists (
      select 1 from public.projects p
      where p.id = invitations.project_id
        and p.deleted_at is null
        and (
          p.auth_user_id = auth.uid()
          or public.has_project_access(p.id, 'edit')
        )
    )
  );

-- Attachments Storage Bucket Setup
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do update set public = true;

-- Storage policies
create policy "Attachments are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'attachments');

create policy "Authenticated users can upload attachments"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments');

create policy "Users can delete attachments"
  on storage.objects for delete to authenticated
  using (bucket_id = 'attachments');
