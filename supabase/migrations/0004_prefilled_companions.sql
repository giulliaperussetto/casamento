-- =====================================================================
-- 0004 — Acompanhantes cadastrados pelas noivas
--
-- Os acompanhantes passam a vir com nome definido no convite. O convidado
-- apenas informa, para cada um, se vai ou não. Nada é criado pelo convidado.
-- =====================================================================

-- p_companions: [{ "guest_id": uuid, "status": "attending"|"declined" }]
create or replace function wedding.submit_rsvp_v4(
  p_invitation_id   uuid,
  p_status          text,
  p_phone           text,
  p_companions      jsonb,
  p_email           text,
  p_message         text,
  p_allow_changes   boolean
) returns jsonb
language plpgsql as $$
declare
  v_inv        wedding.invitations%rowtype;
  v_primary    wedding.guests%rowtype;
  v_item       jsonb;
  v_guest      wedding.guests%rowtype;
  v_seen       uuid[] := '{}';
  v_total      integer;
  v_status     text;
  v_already    boolean;
  v_event_id   uuid;
begin
  -- Bloqueia o convite: envios simultâneos são processados um de cada vez.
  select * into v_inv from wedding.invitations where id = p_invitation_id for update;
  if not found or not v_inv.active then
    raise exception 'INVITATION_INACTIVE' using errcode = 'P0001';
  end if;
  if p_status not in ('attending', 'declined') then
    raise exception 'INVALID_STATUS' using errcode = 'P0001';
  end if;
  if p_phone is null or p_phone !~ '^[0-9]{10,13}$' then
    raise exception 'INVALID_PHONE' using errcode = 'P0001';
  end if;
  if jsonb_typeof(coalesce(p_companions, '[]'::jsonb)) <> 'array' then
    raise exception 'INVALID_PAYLOAD' using errcode = 'P0001';
  end if;

  select * into v_primary from wedding.guests
   where invitation_id = v_inv.id and guest_role = 'primary' for update;
  if not found then
    raise exception 'INVITATION_INACTIVE' using errcode = 'P0001';
  end if;

  v_already := v_primary.attendance_status <> 'pending';
  if v_already and not p_allow_changes then
    raise exception 'ALREADY_RESPONDED' using errcode = 'P0001';
  end if;

  update wedding.guests
     set attendance_status = p_status, responded_at = now(), phone = p_phone
   where id = v_primary.id;

  for v_item in select * from jsonb_array_elements(coalesce(p_companions, '[]'::jsonb)) loop
    select * into v_guest from wedding.guests
     where id = (v_item->>'guest_id')::uuid and invitation_id = v_inv.id and guest_role = 'companion'
     for update;
    if not found then
      -- Um convidado nunca responde por pessoas de outro convite.
      raise exception 'GUEST_NOT_IN_INVITATION' using errcode = 'P0001';
    end if;
    if v_guest.id = any(v_seen) then
      raise exception 'DUPLICATE_GUEST' using errcode = 'P0001';
    end if;
    v_seen := v_seen || v_guest.id;

    -- Se o convidado principal não vai, os acompanhantes também não vão.
    v_status := case when p_status = 'declined' then 'declined' else v_item->>'status' end;
    if v_status not in ('attending', 'declined') then
      raise exception 'INVALID_STATUS' using errcode = 'P0001';
    end if;
    update wedding.guests set attendance_status = v_status, responded_at = now() where id = v_guest.id;
  end loop;

  -- Todos os acompanhantes do convite precisam de uma resposta.
  select count(*) into v_total from wedding.guests where invitation_id = v_inv.id and guest_role = 'companion';
  if coalesce(array_length(v_seen, 1), 0) <> v_total then
    raise exception 'MISSING_RESPONSES' using errcode = 'P0001';
  end if;

  update wedding.invitations
     set companions_declined = false,
         contact_email = nullif(btrim(coalesce(p_email, '')), ''),
         guest_message = nullif(btrim(coalesce(p_message, '')), '')
   where id = v_inv.id;

  insert into wedding.rsvp_events (invitation_id, event_type, details)
  values (
    v_inv.id,
    case when v_already then 'rsvp_updated' else 'rsvp_submitted' end,
    jsonb_build_object(
      'status', p_status,
      'companions_attending', (select count(*) from wedding.guests where invitation_id = v_inv.id and guest_role = 'companion' and attendance_status = 'attending'),
      'companions_declined', (select count(*) from wedding.guests where invitation_id = v_inv.id and guest_role = 'companion' and attendance_status = 'declined')
    )
  )
  returning id into v_event_id;

  return jsonb_build_object('event_id', v_event_id, 'updated', v_already);
end $$;

revoke all on all functions in schema wedding from public;
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on all functions in schema wedding from %I', r);
    end if;
  end loop;
end $$;
