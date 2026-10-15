-- Muuvi community moderation.
-- This migration is committed to GitHub for review only; do not run against the live database until approved.

begin;

create table if not exists public.community_moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null
);

alter table public.community_moderators enable row level security;

drop policy if exists "moderators can read own membership" on public.community_moderators;
create policy "moderators can read own membership"
  on public.community_moderators
  for select to authenticated
  using (user_id = auth.uid());

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete restrict,
  moderator_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('hide', 'restore', 'remove', 'dismiss_reports')),
  previous_status text null,
  new_status text null check (new_status is null or new_status in ('visible', 'hidden', 'removed')),
  reason text not null check (length(trim(reason)) between 3 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists moderation_actions_post_created_idx
  on public.moderation_actions (post_id, created_at desc);

alter table public.moderation_actions enable row level security;
drop policy if exists "moderators can read moderation history" on public.moderation_actions;
create policy "moderators can read moderation history"
  on public.moderation_actions
  for select to authenticated
  using (exists (
    select 1 from public.community_moderators m where m.user_id = auth.uid()
  ));

alter table public.posts
  add column if not exists moderation_status text not null default 'visible'
    check (moderation_status in ('visible', 'hidden', 'removed')),
  add column if not exists moderated_at timestamptz null,
  add column if not exists moderated_by uuid null references auth.users(id) on delete set null;

alter table public.post_reports
  add column if not exists review_status text not null default 'pending'
    check (review_status in ('pending', 'reviewed', 'dismissed')),
  add column if not exists reviewed_at timestamptz null,
  add column if not exists reviewed_by uuid null references auth.users(id) on delete set null;

create index if not exists post_reports_review_status_created_idx
  on public.post_reports (review_status, created_at asc);
create index if not exists posts_moderation_status_created_idx
  on public.posts (moderation_status, created_at desc);

-- Public community feed: visible posts only, unless the signed-in user is a moderator.
drop policy if exists "read posts" on public.posts;
create policy "read posts"
  on public.posts for select to authenticated
  using (
    moderation_status = 'visible'
    or exists (select 1 from public.community_moderators m where m.user_id = auth.uid())
  );

-- Comments and likes on hidden/removed posts are visible only to moderators.
drop policy if exists "read comments" on public.post_comments;
create policy "read comments"
  on public.post_comments for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_comments.post_id
        and (
          p.moderation_status = 'visible'
          or exists (select 1 from public.community_moderators m where m.user_id = auth.uid())
        )
    )
  );

drop policy if exists "read likes" on public.post_likes;
create policy "read likes"
  on public.post_likes for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_likes.post_id
        and (
          p.moderation_status = 'visible'
          or exists (select 1 from public.community_moderators m where m.user_id = auth.uid())
        )
    )
  );

-- Prevent new comments/likes on hidden or removed content through direct API calls.
drop policy if exists "own comment ins" on public.post_comments;
create policy "own comment ins"
  on public.post_comments for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.posts p
      where p.id = post_comments.post_id
        and (
          p.moderation_status = 'visible'
          or exists (select 1 from public.community_moderators m where m.user_id = auth.uid())
        )
    )
  );

drop policy if exists "own like ins" on public.post_likes;
create policy "own like ins"
  on public.post_likes for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.posts p
      where p.id = post_likes.post_id
        and (
          p.moderation_status = 'visible'
          or exists (select 1 from public.community_moderators m where m.user_id = auth.uid())
        )
    )
  );

-- Private image access follows the visibility of the post that references the object.
drop policy if exists "post images read auth" on storage.objects;
create policy "post images read auth"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'post-images'
    and exists (
      select 1 from public.posts p
      where p.image_path = storage.objects.name
        and (
          p.moderation_status = 'visible'
          or exists (select 1 from public.community_moderators m where m.user_id = auth.uid())
        )
    )
  );

-- Reports are private: only moderators may read them. Report creation remains own-user-only.
drop policy if exists "moderators can read reports" on public.post_reports;
create policy "moderators can read reports"
  on public.post_reports for select to authenticated
  using (exists (
    select 1 from public.community_moderators m where m.user_id = auth.uid()
  ));

-- Moderation changes must go through this RPC. Clients cannot directly update moderation columns
-- or insert audit records. The function validates moderator membership on every invocation.
create or replace function public.moderate_community_post(
  p_post_id uuid,
  p_action text,
  p_reason text
)
returns public.posts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post public.posts%rowtype;
  v_previous_status text;
  v_new_status text;
begin
  if auth.uid() is null or not exists (
    select 1 from public.community_moderators m where m.user_id = auth.uid()
  ) then
    raise exception 'Acesso restrito à moderação.' using errcode = '42501';
  end if;

  if p_reason is null or length(trim(p_reason)) < 3 or length(trim(p_reason)) > 1000 then
    raise exception 'Informe um motivo entre 3 e 1000 caracteres.';
  end if;

  select * into v_post from public.posts where id = p_post_id for update;
  if not found then
    raise exception 'Publicação não encontrada.';
  end if;

  v_previous_status := v_post.moderation_status;
  case p_action
    when 'hide' then v_new_status := 'hidden';
    when 'restore' then v_new_status := 'visible';
    when 'remove' then v_new_status := 'removed';
    when 'dismiss_reports' then v_new_status := v_previous_status;
    else raise exception 'Ação de moderação inválida.';
  end case;

  if p_action <> 'dismiss_reports' then
    update public.posts
      set moderation_status = v_new_status,
          moderated_at = now(),
          moderated_by = auth.uid()
      where id = p_post_id
      returning * into v_post;
  end if;

  insert into public.moderation_actions (
    post_id, moderator_id, action, previous_status, new_status, reason
  ) values (
    p_post_id, auth.uid(), p_action, v_previous_status, v_new_status, trim(p_reason)
  );

  if p_action = 'dismiss_reports' then
    update public.post_reports
      set review_status = 'dismissed', reviewed_at = now(), reviewed_by = auth.uid()
      where post_id = p_post_id and review_status = 'pending';
  else
    update public.post_reports
      set review_status = 'reviewed', reviewed_at = now(), reviewed_by = auth.uid()
      where post_id = p_post_id and review_status = 'pending';
  end if;

  return v_post;
end;
$$;

revoke all on function public.moderate_community_post(uuid, text, text) from public, anon;
grant execute on function public.moderate_community_post(uuid, text, text) to authenticated;

-- Do not grant client write access to moderator membership, moderation history, or moderation columns.
revoke insert, update, delete on public.community_moderators from anon, authenticated;
revoke insert, update, delete on public.moderation_actions from anon, authenticated;
revoke update (moderation_status, moderated_at, moderated_by) on public.posts from anon, authenticated;
revoke update (review_status, reviewed_at, reviewed_by) on public.post_reports from anon, authenticated;

commit;
