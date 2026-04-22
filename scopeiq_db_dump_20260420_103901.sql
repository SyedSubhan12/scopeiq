--
-- PostgreSQL database dump
--

\restrict eQSPlEgdjLooyEsn3190I1wQWDzKccDftAmjq10tc1r3Sxjeu7pXlqWrd6wubRJ

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: audit_action_enum; Type: TYPE; Schema: public; Owner: scopeiq
--

CREATE TYPE public.audit_action_enum AS ENUM (
    'create',
    'update',
    'delete',
    'approve',
    'reject',
    'flag',
    'send',
    'dismiss'
);


ALTER TYPE public.audit_action_enum OWNER TO scopeiq;

--
-- Name: brief_status_enum; Type: TYPE; Schema: public; Owner: scopeiq
--

CREATE TYPE public.brief_status_enum AS ENUM (
    'pending_score',
    'scored',
    'clarification_needed',
    'approved',
    'rejected'
);


ALTER TYPE public.brief_status_enum OWNER TO scopeiq;

--
-- Name: brief_template_status_enum; Type: TYPE; Schema: public; Owner: scopeiq
--

CREATE TYPE public.brief_template_status_enum AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE public.brief_template_status_enum OWNER TO scopeiq;

--
-- Name: change_order_status_enum; Type: TYPE; Schema: public; Owner: scopeiq
--

CREATE TYPE public.change_order_status_enum AS ENUM (
    'draft',
    'sent',
    'accepted',
    'declined',
    'expired'
);


ALTER TYPE public.change_order_status_enum OWNER TO scopeiq;

--
-- Name: clause_type_enum; Type: TYPE; Schema: public; Owner: scopeiq
--

CREATE TYPE public.clause_type_enum AS ENUM (
    'deliverable',
    'revision_limit',
    'timeline',
    'exclusion',
    'payment_term',
    'other'
);


ALTER TYPE public.clause_type_enum OWNER TO scopeiq;

--
-- Name: deliverable_status_enum; Type: TYPE; Schema: public; Owner: scopeiq
--

CREATE TYPE public.deliverable_status_enum AS ENUM (
    'not_started',
    'in_progress',
    'in_review',
    'revision_requested',
    'approved',
    'draft',
    'delivered',
    'changes_requested'
);


ALTER TYPE public.deliverable_status_enum OWNER TO scopeiq;

--
-- Name: deliverable_type_enum; Type: TYPE; Schema: public; Owner: scopeiq
--

CREATE TYPE public.deliverable_type_enum AS ENUM (
    'file',
    'figma',
    'loom',
    'youtube',
    'link'
);


ALTER TYPE public.deliverable_type_enum OWNER TO scopeiq;

--
-- Name: flag_severity_enum; Type: TYPE; Schema: public; Owner: scopeiq
--

CREATE TYPE public.flag_severity_enum AS ENUM (
    'low',
    'medium',
    'high'
);


ALTER TYPE public.flag_severity_enum OWNER TO scopeiq;

--
-- Name: flag_status_enum; Type: TYPE; Schema: public; Owner: scopeiq
--

CREATE TYPE public.flag_status_enum AS ENUM (
    'pending',
    'confirmed',
    'dismissed',
    'snoozed',
    'change_order_sent',
    'resolved'
);


ALTER TYPE public.flag_status_enum OWNER TO scopeiq;

--
-- Name: message_source_enum; Type: TYPE; Schema: public; Owner: scopeiq
--

CREATE TYPE public.message_source_enum AS ENUM (
    'portal',
    'email_forward',
    'manual_input'
);


ALTER TYPE public.message_source_enum OWNER TO scopeiq;

--
-- Name: plan_enum; Type: TYPE; Schema: public; Owner: scopeiq
--

CREATE TYPE public.plan_enum AS ENUM (
    'solo',
    'studio',
    'agency'
);


ALTER TYPE public.plan_enum OWNER TO scopeiq;

--
-- Name: project_status_enum; Type: TYPE; Schema: public; Owner: scopeiq
--

CREATE TYPE public.project_status_enum AS ENUM (
    'draft',
    'active',
    'paused',
    'completed',
    'archived',
    'awaiting_brief',
    'clarification_needed',
    'brief_scored',
    'in_progress',
    'deliverable_in_review',
    'on_hold',
    'cancelled'
);


ALTER TYPE public.project_status_enum OWNER TO scopeiq;

--
-- Name: reminder_step_enum; Type: TYPE; Schema: public; Owner: scopeiq
--

CREATE TYPE public.reminder_step_enum AS ENUM (
    'gentle_nudge',
    'deadline_warning',
    'silence_approval'
);


ALTER TYPE public.reminder_step_enum OWNER TO scopeiq;

--
-- Name: user_role_enum; Type: TYPE; Schema: public; Owner: scopeiq
--

CREATE TYPE public.user_role_enum AS ENUM (
    'owner',
    'admin',
    'member',
    'viewer'
);


ALTER TYPE public.user_role_enum OWNER TO scopeiq;

--
-- Name: user_type_enum; Type: TYPE; Schema: public; Owner: scopeiq
--

CREATE TYPE public.user_type_enum AS ENUM (
    'agency',
    'client'
);


ALTER TYPE public.user_type_enum OWNER TO scopeiq;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: approval_events; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.approval_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deliverable_id uuid NOT NULL,
    actor_id uuid,
    actor_name text,
    action character varying(50) NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    event_type character varying(50) DEFAULT 'approval'::character varying NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.approval_events OWNER TO scopeiq;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    actor_id uuid,
    actor_type character varying(20) DEFAULT 'user'::character varying NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    action public.audit_action_enum NOT NULL,
    metadata_json jsonb DEFAULT '{}'::jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_log OWNER TO scopeiq;

--
-- Name: brief_attachments; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.brief_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    brief_id uuid NOT NULL,
    field_key character varying(100) NOT NULL,
    object_key text NOT NULL,
    file_url text NOT NULL,
    original_name character varying(255) NOT NULL,
    mime_type character varying(255),
    size_bytes integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.brief_attachments OWNER TO scopeiq;

--
-- Name: brief_clarification_items; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.brief_clarification_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    field_key character varying(100) NOT NULL,
    field_label character varying(255) NOT NULL,
    prompt text NOT NULL,
    severity character varying(16) DEFAULT 'medium'::character varying NOT NULL,
    source_flag_id character varying(100),
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.brief_clarification_items OWNER TO scopeiq;

--
-- Name: brief_clarification_requests; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.brief_clarification_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    brief_id uuid NOT NULL,
    brief_version_id uuid,
    status character varying(32) DEFAULT 'open'::character varying NOT NULL,
    message text,
    requested_by uuid,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.brief_clarification_requests OWNER TO scopeiq;

--
-- Name: brief_fields; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.brief_fields (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brief_id uuid NOT NULL,
    field_key character varying(100) NOT NULL,
    field_label character varying(255) NOT NULL,
    field_type character varying(50) DEFAULT 'text'::character varying NOT NULL,
    value text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.brief_fields OWNER TO scopeiq;

--
-- Name: brief_template_versions; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.brief_template_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    template_id uuid NOT NULL,
    version_number integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    fields_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    template_status character varying(32) DEFAULT 'published'::character varying NOT NULL,
    published_by uuid,
    published_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    branding_json jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.brief_template_versions OWNER TO scopeiq;

--
-- Name: brief_templates; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.brief_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    fields_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    published_at timestamp with time zone,
    branding_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    clarity_threshold integer DEFAULT 70 NOT NULL,
    status public.brief_template_status_enum DEFAULT 'draft'::public.brief_template_status_enum NOT NULL,
    CONSTRAINT brief_templates_status_check CHECK ((status = ANY (ARRAY['draft'::public.brief_template_status_enum, 'published'::public.brief_template_status_enum, 'archived'::public.brief_template_status_enum])))
);


ALTER TABLE public.brief_templates OWNER TO scopeiq;

--
-- Name: brief_versions; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.brief_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    brief_id uuid NOT NULL,
    version_number integer NOT NULL,
    title character varying(255) NOT NULL,
    status public.brief_status_enum NOT NULL,
    scope_score integer,
    scoring_result_json jsonb,
    answers_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    attachments_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    reviewer_id uuid,
    review_note text,
    submitted_by uuid,
    submitted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.brief_versions OWNER TO scopeiq;

--
-- Name: briefs; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.briefs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    project_id uuid NOT NULL,
    template_id uuid,
    title character varying(255) NOT NULL,
    status public.brief_status_enum DEFAULT 'pending_score'::public.brief_status_enum NOT NULL,
    scope_score integer,
    scoring_result_json jsonb,
    submitted_by uuid,
    submitted_at timestamp with time zone,
    scored_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    reviewer_id uuid,
    template_version_id uuid,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.briefs OWNER TO scopeiq;

--
-- Name: change_orders; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.change_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    project_id uuid NOT NULL,
    scope_flag_id uuid,
    title character varying(255) NOT NULL,
    description text,
    amount integer,
    currency character varying(3) DEFAULT 'USD'::character varying,
    status public.change_order_status_enum DEFAULT 'draft'::public.change_order_status_enum NOT NULL,
    line_items_json jsonb DEFAULT '[]'::jsonb,
    sent_at timestamp with time zone,
    responded_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    work_description text,
    estimated_hours double precision,
    pricing jsonb,
    revised_timeline text,
    signed_at timestamp with time zone,
    signed_by_name character varying(255),
    pdf_url text,
    scope_items_json jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.change_orders OWNER TO scopeiq;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    contact_name character varying(255),
    contact_email character varying(320),
    logo_url text,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    portal_token character varying(64),
    portal_token_hash character varying(64),
    token_expires_at timestamp with time zone,
    requires_email_auth boolean DEFAULT false
);


ALTER TABLE public.clients OWNER TO scopeiq;

--
-- Name: deliverable_revisions; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.deliverable_revisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deliverable_id uuid NOT NULL,
    version_number integer NOT NULL,
    file_url text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


ALTER TABLE public.deliverable_revisions OWNER TO scopeiq;

--
-- Name: deliverables; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.deliverables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    project_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type public.deliverable_type_enum DEFAULT 'file'::public.deliverable_type_enum NOT NULL,
    status public.deliverable_status_enum DEFAULT 'draft'::public.deliverable_status_enum NOT NULL,
    file_url text,
    file_key character varying(512),
    file_size_bytes integer,
    mime_type character varying(255),
    external_url text,
    revision_round integer DEFAULT 0 NOT NULL,
    max_revisions integer DEFAULT 3 NOT NULL,
    due_date timestamp with time zone,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    current_revision_id uuid,
    original_name character varying(255),
    metadata jsonb,
    review_started_at timestamp with time zone,
    ai_feedback_summary jsonb
);


ALTER TABLE public.deliverables OWNER TO scopeiq;

--
-- Name: feedback_items; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.feedback_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deliverable_id uuid NOT NULL,
    author_id uuid,
    author_name text,
    source public.message_source_enum DEFAULT 'portal'::public.message_source_enum NOT NULL,
    body text NOT NULL,
    annotation_json jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone
);


ALTER TABLE public.feedback_items OWNER TO scopeiq;

--
-- Name: invitations; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    email character varying(320) NOT NULL,
    role public.user_role_enum DEFAULT 'member'::public.user_role_enum NOT NULL,
    token uuid DEFAULT gen_random_uuid() NOT NULL,
    invited_by uuid,
    expires_at timestamp with time zone NOT NULL,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.invitations OWNER TO scopeiq;

--
-- Name: marketplace_installs; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.marketplace_installs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    slug character varying(128) NOT NULL,
    brief_template_id uuid,
    installed_by_user_id uuid NOT NULL,
    installed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.marketplace_installs OWNER TO scopeiq;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    client_id uuid NOT NULL,
    sow_id uuid,
    name character varying(255) NOT NULL,
    description text,
    status public.project_status_enum DEFAULT 'draft'::public.project_status_enum NOT NULL,
    budget integer,
    currency character varying(3) DEFAULT 'USD'::character varying,
    start_date date,
    end_date date,
    portal_token character varying(64),
    portal_enabled character varying(5) DEFAULT 'false'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.projects OWNER TO scopeiq;

--
-- Name: rate_card_items; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.rate_card_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    unit character varying(50) DEFAULT 'hour'::character varying NOT NULL,
    rate_in_cents integer NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.rate_card_items OWNER TO scopeiq;

--
-- Name: reminder_logs; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.reminder_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deliverable_id uuid NOT NULL,
    step public.reminder_step_enum NOT NULL,
    recipient_email character varying(320) NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    sequence_step integer DEFAULT 1 NOT NULL,
    delivery_status character varying(50) DEFAULT 'pending'::character varying,
    opened_at timestamp with time zone
);


ALTER TABLE public.reminder_logs OWNER TO scopeiq;

--
-- Name: scope_flags; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.scope_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    project_id uuid NOT NULL,
    sow_clause_id uuid,
    severity public.flag_severity_enum DEFAULT 'medium'::public.flag_severity_enum NOT NULL,
    status public.flag_status_enum DEFAULT 'pending'::public.flag_status_enum NOT NULL,
    title text NOT NULL,
    description text,
    ai_reasoning text,
    evidence jsonb DEFAULT '{}'::jsonb,
    flagged_by uuid,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    snoozed_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    message_text text DEFAULT ''::text NOT NULL,
    confidence double precision DEFAULT 0 NOT NULL,
    suggested_response text,
    matching_clauses_json jsonb DEFAULT '[]'::jsonb,
    sla_deadline timestamp with time zone,
    sla_breached boolean DEFAULT false NOT NULL
);


ALTER TABLE public.scope_flags OWNER TO scopeiq;

--
-- Name: sow_clauses; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.sow_clauses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sow_id uuid NOT NULL,
    clause_type public.clause_type_enum NOT NULL,
    original_text text NOT NULL,
    summary text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sow_clauses OWNER TO scopeiq;

--
-- Name: statements_of_work; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.statements_of_work (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    file_url text,
    file_key character varying(512),
    file_size_bytes integer,
    parsed_text_preview text,
    parsing_result_json jsonb,
    parsed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    status text DEFAULT 'draft'::text NOT NULL
);


ALTER TABLE public.statements_of_work OWNER TO scopeiq;

--
-- Name: users; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id uuid NOT NULL,
    auth_uid uuid NOT NULL,
    email character varying(320) NOT NULL,
    full_name character varying(255) NOT NULL,
    avatar_url text,
    role public.user_role_enum DEFAULT 'member'::public.user_role_enum NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    user_type public.user_type_enum DEFAULT 'agency'::public.user_type_enum NOT NULL
);


ALTER TABLE public.users OWNER TO scopeiq;

--
-- Name: workspaces; Type: TABLE; Schema: public; Owner: scopeiq
--

CREATE TABLE public.workspaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(100) NOT NULL,
    plan public.plan_enum DEFAULT 'solo'::public.plan_enum NOT NULL,
    stripe_customer_id character varying(255),
    stripe_subscription_id character varying(255),
    logo_url text,
    brand_color character varying(7) DEFAULT '#0F6E56'::character varying,
    custom_domain character varying(255),
    settings_json jsonb DEFAULT '{}'::jsonb,
    onboarding_progress jsonb DEFAULT '{}'::jsonb,
    features jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    secondary_color character varying(7) DEFAULT '#1D9E75'::character varying,
    brand_font character varying(100) DEFAULT 'Inter'::character varying,
    reminder_settings jsonb DEFAULT '{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}'::jsonb,
    domain_verification_status text DEFAULT 'pending'::text,
    domain_verification_token text,
    domain_verified_at timestamp with time zone,
    domain_verification_attempted_at timestamp with time zone,
    brief_score_threshold integer DEFAULT 60 NOT NULL,
    scope_guard_threshold text DEFAULT '0.60'::text NOT NULL,
    auto_hold_enabled boolean DEFAULT true NOT NULL,
    auto_approve_after_days integer DEFAULT 3 NOT NULL
);


ALTER TABLE public.workspaces OWNER TO scopeiq;

--
-- Data for Name: approval_events; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.approval_events (id, deliverable_id, actor_id, actor_name, action, comment, created_at, event_type, "timestamp") FROM stdin;
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.audit_log (id, workspace_id, actor_id, actor_type, entity_type, entity_id, action, metadata_json, ip_address, user_agent, created_at) FROM stdin;
0ff0f3f2-fc3e-4a9b-b14c-ca3a0f6bece2	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	workspace	ecd4d302-f038-42d9-b375-e4eff2b32e4d	update	{"fields": ["name"]}	\N	\N	2026-04-06 17:53:09.191347+00
6556de70-b865-4dfe-8b7b-c3b7a2c7851e	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	client	f5bf29fc-ea24-49a2-b88b-9618e38e9b2b	create	{}	\N	\N	2026-04-06 17:53:15.378979+00
946930b9-a0f0-4e0d-8408-6e5212330e92	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	project	f422ff64-94df-474b-9a9d-d83af69d36df	create	{}	\N	\N	2026-04-06 17:53:22.69704+00
a765f2a3-c146-48d5-b87b-64b4188603ba	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	brief_template	03e12e32-d6f7-4202-a158-1f242ed27839	create	{}	\N	\N	2026-04-06 17:53:31.399281+00
883a008c-b704-499d-8267-5bfe7b3d2955	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	deliverable	15f0b401-fe26-488f-835f-a5af2edbd136	create	{}	\N	\N	2026-04-06 18:25:58.709752+00
c96adb6d-ede0-4ef0-a406-017751179673	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	deliverable	15f0b401-fe26-488f-835f-a5af2edbd136	update	{"action": "confirm_upload", "fileKey": "deliverables/ecd4d302-f038-42d9-b375-e4eff2b32e4d/15f0b401-fe26-488f-835f-a5af2edbd136/scopeiq_agency_userflow.svg", "version": 1}	\N	\N	2026-04-06 18:26:11.385943+00
5f45b01d-0a17-496f-8c82-3035309e25df	ecd4d302-f038-42d9-b375-e4eff2b32e4d	\N	user	feedback	5f8152dc-d7b4-4277-b45d-db4791a840d5	create	{"source": "portal", "deliverableId": "15f0b401-fe26-488f-835f-a5af2edbd136"}	\N	\N	2026-04-06 18:27:13.056051+00
22623184-6d22-4f01-a350-8150a933e504	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	feedback	a949f342-2f27-4234-b818-fb35be8ad0cb	create	{"source": "manual_input", "deliverableId": "15f0b401-fe26-488f-835f-a5af2edbd136"}	\N	\N	2026-04-06 18:27:32.20424+00
a362a125-df7e-4534-91b1-afee070522f0	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	brief_template	03e12e32-d6f7-4202-a158-1f242ed27839	update	{"fields": ["name", "description", "fieldsJson", "brandingJson", "isDefault"]}	\N	\N	2026-04-06 18:29:13.680882+00
9701f83c-a9e3-411c-91bc-d3d5ce191050	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	brief_template	03e12e32-d6f7-4202-a158-1f242ed27839	update	{"fields": ["name", "description", "fieldsJson", "brandingJson", "isDefault"]}	\N	\N	2026-04-06 18:29:17.880253+00
8f32acd2-66e2-4239-9763-503d21814d23	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	brief_template	03e12e32-d6f7-4202-a158-1f242ed27839	update	{"fields": ["name", "description", "fieldsJson", "brandingJson", "isDefault"]}	\N	\N	2026-04-06 18:29:20.015122+00
5c0bfdf3-eb2e-4163-bdab-ec209e8dc48b	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	brief_template	03e12e32-d6f7-4202-a158-1f242ed27839	update	{"fields": ["name", "description", "fieldsJson", "brandingJson", "isDefault"]}	\N	\N	2026-04-06 18:29:20.994021+00
d9f18a2b-4c55-4a15-b6b0-775a552639f2	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	brief_template	03e12e32-d6f7-4202-a158-1f242ed27839	update	{"fields": ["name", "description", "fieldsJson", "brandingJson", "isDefault"]}	\N	\N	2026-04-06 18:29:29.894975+00
2a35920c-5cb0-44a8-9ff5-7c7de97a216c	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	brief_template	03e12e32-d6f7-4202-a158-1f242ed27839	update	{"fields": ["name", "description", "fieldsJson", "brandingJson", "isDefault"]}	\N	\N	2026-04-06 18:29:30.154794+00
8483661d-e9aa-4145-9297-2267c027a135	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	brief_template	03e12e32-d6f7-4202-a158-1f242ed27839	update	{"fields": ["name", "description", "fieldsJson", "brandingJson", "isDefault"]}	\N	\N	2026-04-06 18:48:22.516849+00
ebdf01e2-fd41-4b0a-854d-ca9184772b86	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	brief_template	03e12e32-d6f7-4202-a158-1f242ed27839	update	{"lifecycle": "published", "versionId": "6d6ce1af-9c5d-464e-b6bc-16810084d570", "versionNumber": 1}	\N	\N	2026-04-06 18:48:22.969908+00
ab890820-0f74-4a17-8273-fc68286706b3	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	brief_template	03e12e32-d6f7-4202-a158-1f242ed27839	update	{"fields": ["name", "description", "fieldsJson", "brandingJson", "isDefault"]}	\N	\N	2026-04-07 11:10:33.577783+00
3032fa15-fdc2-4e4c-9de8-2af1de14b253	ecd4d302-f038-42d9-b375-e4eff2b32e4d	8336402b-cf82-48e2-9940-eb48bbc77020	user	brief_template	03e12e32-d6f7-4202-a158-1f242ed27839	update	{"lifecycle": "published", "versionId": "f13f8655-651c-4466-aeb0-45354cb80bd5", "versionNumber": 2}	\N	\N	2026-04-07 11:10:34.141402+00
0f15fdc6-0aa0-4d77-ba7a-0c8404a47e5f	ecd4d302-f038-42d9-b375-e4eff2b32e4d	\N	system	brief	bbd552da-d7d9-4f66-aad3-18ae645debde	create	{"action": "brief_auto_provisioned", "source": "portal_session", "templateId": "03e12e32-d6f7-4202-a158-1f242ed27839", "fieldsCount": 5}	\N	\N	2026-04-07 11:59:15.60307+00
e70aaf88-3506-484b-87ce-8a173a5b4383	ecd4d302-f038-42d9-b375-e4eff2b32e4d	\N	client	brief	bbd552da-d7d9-4f66-aad3-18ae645debde	update	{"action": "confirm_attachment_upload", "fieldKey": "file_upload_1775500168684_z719", "attachmentId": "dfe07a0d-0d27-4830-a7bb-eab92f86f01e"}	\N	\N	2026-04-07 14:52:59.529391+00
542c085c-d7ed-4013-b667-5af846a6983d	ecd4d302-f038-42d9-b375-e4eff2b32e4d	\N	client	brief	bbd552da-d7d9-4f66-aad3-18ae645debde	update	{"action": "portal_submit"}	\N	\N	2026-04-07 14:53:02.414509+00
1857d802-2252-46df-9710-741c6752a690	ecd4d302-f038-42d9-b375-e4eff2b32e4d	\N	system	brief	de4450a2-9a73-47e3-b53f-2d514ef087c9	create	{"action": "brief_auto_provisioned", "source": "portal_session", "templateId": "03e12e32-d6f7-4202-a158-1f242ed27839", "fieldsCount": 5}	\N	\N	2026-04-07 15:07:57.92627+00
35ce66ce-8c8c-4b6e-b723-0e21925de924	4ca7779e-4405-4809-a18f-72b35a362f3e	108160a2-d34f-4973-8f8b-0cb4544614c0	user	workspace	4ca7779e-4405-4809-a18f-72b35a362f3e	update	{"fields": ["name"]}	\N	\N	2026-04-11 20:37:24.22684+00
218d7c85-87a0-45d3-92b4-6abb08a15fa2	4ca7779e-4405-4809-a18f-72b35a362f3e	108160a2-d34f-4973-8f8b-0cb4544614c0	user	client	eab65f64-cfab-411d-89c5-2f499edfd641	create	{}	\N	\N	2026-04-11 22:44:08.755785+00
a72c0d0b-02c1-4750-910d-17c58279aa6e	4ca7779e-4405-4809-a18f-72b35a362f3e	108160a2-d34f-4973-8f8b-0cb4544614c0	user	project	b3cfae09-7e92-4d55-a900-78f8a0204640	create	{}	\N	\N	2026-04-11 22:44:29.762637+00
7c89ea83-d7d2-49b5-a4a4-001c451b77c0	4ca7779e-4405-4809-a18f-72b35a362f3e	108160a2-d34f-4973-8f8b-0cb4544614c0	user	deliverable	f2fb638e-a8cf-4a12-aab4-f85b3a357dec	create	{}	\N	\N	2026-04-11 23:56:28.555184+00
902d424e-0105-48b3-9cca-67d1cd759ca9	4ca7779e-4405-4809-a18f-72b35a362f3e	108160a2-d34f-4973-8f8b-0cb4544614c0	user	nps_feedback	5c9a82d2-cb33-45c3-95af-1e566caea270	create	{"score": 8, "comment": null, "surface": "dashboard", "category": "passive"}	\N	\N	2026-04-12 06:29:22.556804+00
0b8f412e-ef60-4aa4-9791-806fbfe9e418	d2f9d484-82d9-43d9-a49d-952ba9fd0029	b0bcca85-5f1e-45fd-b3c8-369c2adb3aa4	user	workspace	d2f9d484-82d9-43d9-a49d-952ba9fd0029	update	{"fields": ["name"]}	\N	\N	2026-04-12 15:37:16.757348+00
35cb5c67-0704-4222-86b0-9004da49daad	d2f9d484-82d9-43d9-a49d-952ba9fd0029	b0bcca85-5f1e-45fd-b3c8-369c2adb3aa4	user	workspace	d2f9d484-82d9-43d9-a49d-952ba9fd0029	update	{"fields": ["name"]}	\N	\N	2026-04-12 15:42:01.753166+00
6759e710-5edc-4715-9617-3154778f19e6	d2f9d484-82d9-43d9-a49d-952ba9fd0029	b0bcca85-5f1e-45fd-b3c8-369c2adb3aa4	user	workspace	d2f9d484-82d9-43d9-a49d-952ba9fd0029	update	{"fields": ["name"]}	\N	\N	2026-04-12 15:46:57.682087+00
ad0bc7a6-e934-438e-ac07-22aba6d66ff3	4ca7779e-4405-4809-a18f-72b35a362f3e	108160a2-d34f-4973-8f8b-0cb4544614c0	user	marketplace_install	6d862158-a56b-4398-9d4d-5ba010fbb608	create	{"slug": "tpl-brand-identity", "templateId": "eccc4ef3-f2b1-4644-9dc9-f42b8cce8f19"}	\N	\N	2026-04-20 05:21:39.499201+00
6d997b2b-7d49-4c17-8b96-1fff27f1bb22	4ca7779e-4405-4809-a18f-72b35a362f3e	108160a2-d34f-4973-8f8b-0cb4544614c0	user	brief_template	eccc4ef3-f2b1-4644-9dc9-f42b8cce8f19	update	{"fields": ["name", "description", "fieldsJson", "brandingJson", "isDefault"]}	\N	\N	2026-04-20 05:24:12.379136+00
9c4ed2bd-447b-48bb-9ec1-9d9893525da0	4ca7779e-4405-4809-a18f-72b35a362f3e	108160a2-d34f-4973-8f8b-0cb4544614c0	user	brief_template	eccc4ef3-f2b1-4644-9dc9-f42b8cce8f19	update	{"lifecycle": "published", "versionId": "a20a1d3a-9985-483f-b44c-440b2e1e3866", "versionNumber": 1}	\N	\N	2026-04-20 05:24:13.685191+00
9885bad2-90eb-485b-ad3c-78574efc0658	4ca7779e-4405-4809-a18f-72b35a362f3e	\N	system	brief	44ad5c05-37c0-4ff7-8484-b89031bc3c45	create	{"action": "brief_auto_provisioned", "source": "portal_session", "templateId": "eccc4ef3-f2b1-4644-9dc9-f42b8cce8f19", "fieldsCount": 3}	\N	\N	2026-04-20 05:32:55.789318+00
74ab3e38-4b6d-44ac-9cec-6493153e0574	4ca7779e-4405-4809-a18f-72b35a362f3e	\N	client	brief	44ad5c05-37c0-4ff7-8484-b89031bc3c45	update	{"action": "portal_submit"}	\N	\N	2026-04-20 05:34:42.152298+00
\.


--
-- Data for Name: brief_attachments; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.brief_attachments (id, workspace_id, brief_id, field_key, object_key, file_url, original_name, mime_type, size_bytes, created_at, updated_at, deleted_at) FROM stdin;
dfe07a0d-0d27-4830-a7bb-eab92f86f01e	ecd4d302-f038-42d9-b375-e4eff2b32e4d	bbd552da-d7d9-4f66-aad3-18ae645debde	file_upload_1775500168684_z719	briefs/ecd4d302-f038-42d9-b375-e4eff2b32e4d/bbd552da-d7d9-4f66-aad3-18ae645debde/file_upload_1775500168684_z719/1775573575257-original-25b981b24b562f7be24c11cba006dfcd.webp	http://localhost:9000/scopeiq-assets/briefs/ecd4d302-f038-42d9-b375-e4eff2b32e4d/bbd552da-d7d9-4f66-aad3-18ae645debde/file_upload_1775500168684_z719/1775573575257-original-25b981b24b562f7be24c11cba006dfcd.webp?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=scopeiq%2F20260407%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260407T145259Z&X-Amz-Expires=3600&X-Amz-Signature=451892b5868b0c22c778c1a2aaf8f4643394b43da66f2cf1f4c09abf108b0cd7&X-Amz-SignedHeaders=host&x-id=GetObject	original-25b981b24b562f7be24c11cba006dfcd.webp	image/webp	66320	2026-04-07 14:52:59.479008+00	2026-04-07 14:52:59.479008+00	\N
\.


--
-- Data for Name: brief_clarification_items; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.brief_clarification_items (id, request_id, field_key, field_label, prompt, severity, source_flag_id, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: brief_clarification_requests; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.brief_clarification_requests (id, workspace_id, brief_id, brief_version_id, status, message, requested_by, requested_at, resolved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: brief_fields; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.brief_fields (id, brief_id, field_key, field_label, field_type, value, sort_order, created_at, updated_at) FROM stdin;
1fcad201-8c92-4bcb-ad91-cb579978f8b8	44ad5c05-37c0-4ff7-8484-b89031bc3c45	brand_voice	Brand Voice & Tone	textarea	kfbvjkb eflvbeljdb vebdvjkbadjbv edabds vajd ved cjkabdmk vhjagfjv nabfij v	1	2026-04-20 05:32:55.789318+00	2026-04-20 05:34:41.217+00
c119cfd2-5eef-4a3e-869d-cc4014ffd141	44ad5c05-37c0-4ff7-8484-b89031bc3c45	target_audience	Target Audience	textarea	ns divlkj dnvjibfd	2	2026-04-20 05:32:55.789318+00	2026-04-20 05:34:41.253+00
d6f1fb22-227c-4d09-ada3-0aebfb111c1f	44ad5c05-37c0-4ff7-8484-b89031bc3c45	visual_direction	Visual Direction	textarea	kjbisdbv ljbsdjv	3	2026-04-20 05:32:55.789318+00	2026-04-20 05:34:41.263+00
2e036c66-5fe9-45e2-a527-254ec51748e7	bbd552da-d7d9-4f66-aad3-18ae645debde	text_1775500152163_7gzh	Short Text	text	Hi	0	2026-04-07 11:59:15.60307+00	2026-04-07 14:53:01.389+00
4a9c0857-e50e-484a-af89-7d76b0d12634	bbd552da-d7d9-4f66-aad3-18ae645debde	textarea_1775500155362_x5ih	Long Text	textarea	kjnfvjknerkjvndaerfvfvf	1	2026-04-07 11:59:15.60307+00	2026-04-07 14:53:01.415+00
b3c30502-d2e7-4bfc-b118-850072dc6b26	bbd552da-d7d9-4f66-aad3-18ae645debde	single_choice_1775500155909_faml	Single Choice	single_choice	Option 1	2	2026-04-07 11:59:15.60307+00	2026-04-07 14:53:01.426+00
bf22998c-c435-4c5d-99ce-2330fa141f5a	bbd552da-d7d9-4f66-aad3-18ae645debde	date_1775500167758_n4ke	Date	date	0156-02-12	3	2026-04-07 11:59:15.60307+00	2026-04-07 14:53:01.472+00
43e72aee-25c0-491e-86f6-7a14e1d9a690	bbd552da-d7d9-4f66-aad3-18ae645debde	file_upload_1775500168684_z719	File Upload	file_upload	original-25b981b24b562f7be24c11cba006dfcd.webp	4	2026-04-07 11:59:15.60307+00	2026-04-07 14:53:01.482+00
ca1b4d97-0b47-4dc4-ace3-31ddb6261db6	de4450a2-9a73-47e3-b53f-2d514ef087c9	text_1775500152163_7gzh	Short Text	text	\N	0	2026-04-07 15:07:57.92627+00	2026-04-10 12:11:32.959+00
6e107edf-999c-4327-acf1-de3dfb8f8f48	de4450a2-9a73-47e3-b53f-2d514ef087c9	textarea_1775500155362_x5ih	Long Text	textarea	\N	1	2026-04-07 15:07:57.92627+00	2026-04-10 12:11:32.965+00
a2a946a5-fcb5-43ce-a97b-744b1f2ba82f	de4450a2-9a73-47e3-b53f-2d514ef087c9	single_choice_1775500155909_faml	Single Choice	single_choice	\N	2	2026-04-07 15:07:57.92627+00	2026-04-10 12:11:32.969+00
25b7fc5b-5bd1-4474-ba90-f38d1699e678	de4450a2-9a73-47e3-b53f-2d514ef087c9	date_1775500167758_n4ke	Date	date	\N	3	2026-04-07 15:07:57.92627+00	2026-04-10 12:11:32.973+00
5e9102ab-04e9-460b-bec3-7c730f3abc2e	de4450a2-9a73-47e3-b53f-2d514ef087c9	file_upload_1775500168684_z719	File Upload	file_upload	\N	4	2026-04-07 15:07:57.92627+00	2026-04-10 12:11:32.98+00
\.


--
-- Data for Name: brief_template_versions; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.brief_template_versions (id, workspace_id, template_id, version_number, name, description, fields_json, is_default, template_status, published_by, published_at, created_at, branding_json) FROM stdin;
6d6ce1af-9c5d-464e-b6bc-16810084d570	ecd4d302-f038-42d9-b375-e4eff2b32e4d	03e12e32-d6f7-4202-a158-1f242ed27839	1	Web design		[{"key": "text_1775500152163_7gzh", "type": "text", "label": "Short Text", "order": 0, "required": false, "conditions": []}, {"key": "textarea_1775500155362_x5ih", "type": "textarea", "label": "Long Text", "order": 1, "required": false, "conditions": []}, {"key": "single_choice_1775500155909_faml", "type": "single_choice", "label": "Single Choice", "order": 2, "options": ["Option 1"], "required": false, "conditions": []}, {"key": "date_1775500167758_n4ke", "type": "date", "label": "Date", "order": 3, "required": false, "conditions": []}, {"key": "file_upload_1775500168684_z719", "type": "file_upload", "label": "File Upload", "order": 4, "required": false, "conditions": []}]	f	published	8336402b-cf82-48e2-9940-eb48bbc77020	2026-04-06 18:48:22.956+00	2026-04-06 18:48:22.957434+00	{}
f13f8655-651c-4466-aeb0-45354cb80bd5	ecd4d302-f038-42d9-b375-e4eff2b32e4d	03e12e32-d6f7-4202-a158-1f242ed27839	2	Web design		[{"key": "text_1775500152163_7gzh", "type": "text", "label": "Short Text", "order": 0, "required": false, "conditions": []}, {"key": "textarea_1775500155362_x5ih", "type": "textarea", "label": "Long Text", "order": 1, "required": false, "conditions": []}, {"key": "single_choice_1775500155909_faml", "type": "single_choice", "label": "Single Choice", "order": 2, "options": ["Option 1"], "required": false, "conditions": []}, {"key": "date_1775500167758_n4ke", "type": "date", "label": "Date", "order": 3, "required": false, "conditions": []}, {"key": "file_upload_1775500168684_z719", "type": "file_upload", "label": "File Upload", "order": 4, "required": false, "conditions": []}]	f	published	8336402b-cf82-48e2-9940-eb48bbc77020	2026-04-07 11:10:34.124+00	2026-04-07 11:10:34.126261+00	{}
a20a1d3a-9985-483f-b44c-440b2e1e3866	4ca7779e-4405-4809-a18f-72b35a362f3e	eccc4ef3-f2b1-4644-9dc9-f42b8cce8f19	1	Brand Identity Sprint	10-question deep-dive on brand voice, audience, and visual direction. Built for studios doing rapid identity work.	[{"key": "brand_voice", "type": "textarea", "label": "Brand Voice & Tone", "order": 1, "helpText": "Be specific about adjectives and communication style.", "required": true, "conditions": [], "placeholder": "How would you describe your brand's personality and voice?"}, {"key": "target_audience", "type": "textarea", "label": "Target Audience", "order": 2, "helpText": "Include demographics, psychographics, and pain points.", "required": true, "conditions": [], "placeholder": "Who is your ideal customer? Describe in detail."}, {"key": "visual_direction", "type": "textarea", "label": "Visual Direction", "order": 3, "helpText": "Reference other brands or design styles if helpful.", "required": false, "conditions": [], "placeholder": "What's the visual style? Colors, typography, imagery style?"}]	f	published	108160a2-d34f-4973-8f8b-0cb4544614c0	2026-04-20 05:24:13.649+00	2026-04-20 05:24:13.659902+00	{}
\.


--
-- Data for Name: brief_templates; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.brief_templates (id, workspace_id, name, description, fields_json, is_default, created_at, updated_at, deleted_at, published_at, branding_json, clarity_threshold, status) FROM stdin;
03e12e32-d6f7-4202-a158-1f242ed27839	ecd4d302-f038-42d9-b375-e4eff2b32e4d	Web design		[{"key": "text_1775500152163_7gzh", "type": "text", "label": "Short Text", "order": 0, "required": false, "conditions": []}, {"key": "textarea_1775500155362_x5ih", "type": "textarea", "label": "Long Text", "order": 1, "required": false, "conditions": []}, {"key": "single_choice_1775500155909_faml", "type": "single_choice", "label": "Single Choice", "order": 2, "options": ["Option 1"], "required": false, "conditions": []}, {"key": "date_1775500167758_n4ke", "type": "date", "label": "Date", "order": 3, "required": false, "conditions": []}, {"key": "file_upload_1775500168684_z719", "type": "file_upload", "label": "File Upload", "order": 4, "required": false, "conditions": []}]	f	2026-04-06 17:53:31.39016+00	2026-04-07 11:10:34.134+00	\N	2026-04-07 11:10:34.124+00	{}	70	published
eccc4ef3-f2b1-4644-9dc9-f42b8cce8f19	4ca7779e-4405-4809-a18f-72b35a362f3e	Brand Identity Sprint	10-question deep-dive on brand voice, audience, and visual direction. Built for studios doing rapid identity work.	[{"key": "brand_voice", "type": "textarea", "label": "Brand Voice & Tone", "order": 1, "helpText": "Be specific about adjectives and communication style.", "required": true, "conditions": [], "placeholder": "How would you describe your brand's personality and voice?"}, {"key": "target_audience", "type": "textarea", "label": "Target Audience", "order": 2, "helpText": "Include demographics, psychographics, and pain points.", "required": true, "conditions": [], "placeholder": "Who is your ideal customer? Describe in detail."}, {"key": "visual_direction", "type": "textarea", "label": "Visual Direction", "order": 3, "helpText": "Reference other brands or design styles if helpful.", "required": false, "conditions": [], "placeholder": "What's the visual style? Colors, typography, imagery style?"}]	f	2026-04-20 05:21:39.483883+00	2026-04-20 05:24:13.674+00	\N	2026-04-20 05:24:13.649+00	{}	70	published
\.


--
-- Data for Name: brief_versions; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.brief_versions (id, workspace_id, brief_id, version_number, title, status, scope_score, scoring_result_json, answers_json, attachments_json, reviewer_id, review_note, submitted_by, submitted_at, created_at, updated_at) FROM stdin;
123fceca-62cc-421e-b2d0-2b4c5f87c6ba	ecd4d302-f038-42d9-b375-e4eff2b32e4d	bbd552da-d7d9-4f66-aad3-18ae645debde	1	Web design	pending_score	\N	\N	[{"id": "2e036c66-5fe9-45e2-a527-254ec51748e7", "value": "Hi", "briefId": "bbd552da-d7d9-4f66-aad3-18ae645debde", "fieldKey": "text_1775500152163_7gzh", "createdAt": "2026-04-07T11:59:15.603Z", "fieldType": "text", "sortOrder": 0, "updatedAt": "2026-04-07T14:53:01.389Z", "fieldLabel": "Short Text"}, {"id": "4a9c0857-e50e-484a-af89-7d76b0d12634", "value": "kjnfvjknerkjvndaerfvfvf", "briefId": "bbd552da-d7d9-4f66-aad3-18ae645debde", "fieldKey": "textarea_1775500155362_x5ih", "createdAt": "2026-04-07T11:59:15.603Z", "fieldType": "textarea", "sortOrder": 1, "updatedAt": "2026-04-07T14:53:01.415Z", "fieldLabel": "Long Text"}, {"id": "b3c30502-d2e7-4bfc-b118-850072dc6b26", "value": "Option 1", "briefId": "bbd552da-d7d9-4f66-aad3-18ae645debde", "fieldKey": "single_choice_1775500155909_faml", "createdAt": "2026-04-07T11:59:15.603Z", "fieldType": "single_choice", "sortOrder": 2, "updatedAt": "2026-04-07T14:53:01.426Z", "fieldLabel": "Single Choice"}, {"id": "bf22998c-c435-4c5d-99ce-2330fa141f5a", "value": "0156-02-12", "briefId": "bbd552da-d7d9-4f66-aad3-18ae645debde", "fieldKey": "date_1775500167758_n4ke", "createdAt": "2026-04-07T11:59:15.603Z", "fieldType": "date", "sortOrder": 3, "updatedAt": "2026-04-07T14:53:01.472Z", "fieldLabel": "Date"}, {"id": "43e72aee-25c0-491e-86f6-7a14e1d9a690", "value": "original-25b981b24b562f7be24c11cba006dfcd.webp", "briefId": "bbd552da-d7d9-4f66-aad3-18ae645debde", "fieldKey": "file_upload_1775500168684_z719", "createdAt": "2026-04-07T11:59:15.603Z", "fieldType": "file_upload", "sortOrder": 4, "updatedAt": "2026-04-07T14:53:01.482Z", "fieldLabel": "File Upload"}]	[{"id": "dfe07a0d-0d27-4830-a7bb-eab92f86f01e", "fileUrl": "http://localhost:9000/scopeiq-assets/briefs/ecd4d302-f038-42d9-b375-e4eff2b32e4d/bbd552da-d7d9-4f66-aad3-18ae645debde/file_upload_1775500168684_z719/1775573575257-original-25b981b24b562f7be24c11cba006dfcd.webp?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=scopeiq%2F20260407%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260407T145259Z&X-Amz-Expires=3600&X-Amz-Signature=451892b5868b0c22c778c1a2aaf8f4643394b43da66f2cf1f4c09abf108b0cd7&X-Amz-SignedHeaders=host&x-id=GetObject", "fieldKey": "file_upload_1775500168684_z719", "mimeType": "image/webp", "sizeBytes": 66320, "originalName": "original-25b981b24b562f7be24c11cba006dfcd.webp"}]	\N	\N	\N	2026-04-07 14:53:01.571+00	2026-04-07 14:53:02.304836+00	2026-04-07 14:53:02.304836+00
55baf83e-184b-4d4a-80b7-bba520b7de94	4ca7779e-4405-4809-a18f-72b35a362f3e	44ad5c05-37c0-4ff7-8484-b89031bc3c45	1	Brand Identity Sprint	pending_score	\N	\N	[{"id": "1fcad201-8c92-4bcb-ad91-cb579978f8b8", "value": "kfbvjkb eflvbeljdb vebdvjkbadjbv edabds vajd ved cjkabdmk vhjagfjv nabfij v", "briefId": "44ad5c05-37c0-4ff7-8484-b89031bc3c45", "fieldKey": "brand_voice", "createdAt": "2026-04-20T05:32:55.789Z", "fieldType": "textarea", "sortOrder": 1, "updatedAt": "2026-04-20T05:34:41.217Z", "fieldLabel": "Brand Voice & Tone"}, {"id": "c119cfd2-5eef-4a3e-869d-cc4014ffd141", "value": "ns divlkj dnvjibfd", "briefId": "44ad5c05-37c0-4ff7-8484-b89031bc3c45", "fieldKey": "target_audience", "createdAt": "2026-04-20T05:32:55.789Z", "fieldType": "textarea", "sortOrder": 2, "updatedAt": "2026-04-20T05:34:41.253Z", "fieldLabel": "Target Audience"}, {"id": "d6f1fb22-227c-4d09-ada3-0aebfb111c1f", "value": "kjbisdbv ljbsdjv", "briefId": "44ad5c05-37c0-4ff7-8484-b89031bc3c45", "fieldKey": "visual_direction", "createdAt": "2026-04-20T05:32:55.789Z", "fieldType": "textarea", "sortOrder": 3, "updatedAt": "2026-04-20T05:34:41.263Z", "fieldLabel": "Visual Direction"}]	[]	\N	\N	\N	2026-04-20 05:34:41.316+00	2026-04-20 05:34:42.104358+00	2026-04-20 05:34:42.104358+00
\.


--
-- Data for Name: briefs; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.briefs (id, workspace_id, project_id, template_id, title, status, scope_score, scoring_result_json, submitted_by, submitted_at, scored_at, created_at, updated_at, deleted_at, reviewer_id, template_version_id, version) FROM stdin;
de4450a2-9a73-47e3-b53f-2d514ef087c9	ecd4d302-f038-42d9-b375-e4eff2b32e4d	f422ff64-94df-474b-9a9d-d83af69d36df	03e12e32-d6f7-4202-a158-1f242ed27839	Web design	pending_score	\N	\N	\N	\N	\N	2026-04-07 15:07:57.92627+00	2026-04-10 12:11:32.985+00	\N	\N	f13f8655-651c-4466-aeb0-45354cb80bd5	1
bbd552da-d7d9-4f66-aad3-18ae645debde	ecd4d302-f038-42d9-b375-e4eff2b32e4d	f422ff64-94df-474b-9a9d-d83af69d36df	03e12e32-d6f7-4202-a158-1f242ed27839	Web design	pending_score	\N	\N	\N	2026-04-07 14:53:01.571+00	\N	2026-04-07 11:59:15.60307+00	2026-04-07 14:53:01.571+00	\N	\N	f13f8655-651c-4466-aeb0-45354cb80bd5	1
44ad5c05-37c0-4ff7-8484-b89031bc3c45	4ca7779e-4405-4809-a18f-72b35a362f3e	b3cfae09-7e92-4d55-a900-78f8a0204640	eccc4ef3-f2b1-4644-9dc9-f42b8cce8f19	Brand Identity Sprint	pending_score	\N	\N	\N	2026-04-20 05:34:41.316+00	\N	2026-04-20 05:32:55.789318+00	2026-04-20 05:34:41.316+00	\N	\N	a20a1d3a-9985-483f-b44c-440b2e1e3866	1
\.


--
-- Data for Name: change_orders; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.change_orders (id, workspace_id, project_id, scope_flag_id, title, description, amount, currency, status, line_items_json, sent_at, responded_at, expires_at, created_by, created_at, updated_at, work_description, estimated_hours, pricing, revised_timeline, signed_at, signed_by_name, pdf_url, scope_items_json) FROM stdin;
44444444-4444-4444-4444-444444444444	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	dddddddd-dddd-dddd-dddd-dddddddddddd	33333333-3333-3333-3333-333333333333	Additional Pages & Mobile App Design	\N	\N	USD	sent	[{"unit": "page", "quantity": 10, "rate_in_cents": 50000, "rate_card_name": "Additional Page Design", "subtotal_cents": 500000}, {"unit": "project", "quantity": 1, "rate_in_cents": 300000, "rate_card_name": "Mobile App UX", "subtotal_cents": 300000}]	2026-04-05 17:25:53.792395+00	\N	\N	\N	2026-04-06 17:25:53.792395+00	2026-04-06 17:25:53.792395+00	Design and development of a mobile app version plus 10 additional web pages beyond the original 5-page agreement.	40	{"basis": "fixed", "amount": 8000, "currency": "USD"}	Timeline extended by 3 weeks	\N	\N	\N	[]
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.clients (id, workspace_id, name, contact_name, contact_email, logo_url, notes, metadata, created_at, updated_at, deleted_at, portal_token, portal_token_hash, token_expires_at, requires_email_auth) FROM stdin;
cccccccc-cccc-cccc-cccc-cccccccccccc	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	Test Client Co	Jane Client	jane@testclient.com	\N	\N	{}	2026-04-06 17:25:53.792395+00	2026-04-06 17:25:53.792395+00	\N	aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa	ffe054fe7ae0cb6dc65c3af9b61d5209f439851db43d0ba5997337df154668eb	\N	f
f5bf29fc-ea24-49a2-b88b-9618e38e9b2b	ecd4d302-f038-42d9-b375-e4eff2b32e4d	Spike	\N	\N	\N	\N	{}	2026-04-06 17:53:15.372129+00	2026-04-06 17:53:15.372129+00	\N	\N	\N	\N	f
eab65f64-cfab-411d-89c5-2f499edfd641	4ca7779e-4405-4809-a18f-72b35a362f3e	Acme	Jane	\N	\N	\N	{}	2026-04-11 22:44:08.733827+00	2026-04-11 22:44:08.733827+00	\N	\N	\N	\N	f
\.


--
-- Data for Name: deliverable_revisions; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.deliverable_revisions (id, deliverable_id, version_number, file_url, notes, created_at, created_by) FROM stdin;
b9103424-ab89-407e-aa0f-f8d83c758ae3	15f0b401-fe26-488f-835f-a5af2edbd136	1	http://localhost:9000/scopeiq-assets/deliverables/ecd4d302-f038-42d9-b375-e4eff2b32e4d/15f0b401-fe26-488f-835f-a5af2edbd136/scopeiq_agency_userflow.svg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=scopeiq%2F20260406%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260406T182611Z&X-Amz-Expires=3600&X-Amz-Signature=b0de5e2094bc7be923b06fe24f3d663db8c8816f03436e3b0b0760f55954f869&X-Amz-SignedHeaders=host&x-id=GetObject	\N	2026-04-06 18:26:11.385943+00	8336402b-cf82-48e2-9940-eb48bbc77020
b2488eef-3f85-4dc7-9cf3-890dae122d21	f2fb638e-a8cf-4a12-aab4-f85b3a357dec	1	http://localhost:9000/scopeiq-assets/deliverables/4ca7779e-4405-4809-a18f-72b35a362f3e/f2fb638e-a8cf-4a12-aab4-f85b3a357dec/Generated%20Image%20April%2007%2C%202026%20-%208_10PM.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=scopeiq%2F20260411%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260411T235642Z&X-Amz-Expires=3600&X-Amz-Signature=28018f85626e303dde3c6663ffe03e7547cfb3f14a10bb911daaad2013719560&X-Amz-SignedHeaders=host&x-id=GetObject	\N	2026-04-11 23:56:42.228904+00	108160a2-d34f-4973-8f8b-0cb4544614c0
\.


--
-- Data for Name: deliverables; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.deliverables (id, workspace_id, project_id, name, description, type, status, file_url, file_key, file_size_bytes, mime_type, external_url, revision_round, max_revisions, due_date, uploaded_by, created_at, updated_at, deleted_at, current_revision_id, original_name, metadata, review_started_at, ai_feedback_summary) FROM stdin;
eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	dddddddd-dddd-dddd-dddd-dddddddddddd	Homepage Mockup	Figma mockup for the homepage redesign	figma	in_review	\N	\N	\N	\N	https://figma.com/file/test-mockup	0	2	\N	\N	2026-04-06 17:25:53.792395+00	2026-04-06 17:25:53.792395+00	\N	\N	\N	\N	2026-04-04 17:25:53.792395+00	\N
88888888-8888-8888-8888-888888888888	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	dddddddd-dddd-dddd-dddd-dddddddddddd	About Page Design	Design for the about page	file	in_review	https://test-bucket.scopeiq/deliverables/about-page-v2.pdf	\N	\N	\N	\N	2	2	\N	\N	2026-04-06 17:25:53.792395+00	2026-04-06 17:25:53.792395+00	\N	\N	\N	\N	2026-04-06 17:25:53.792395+00	\N
99999999-9999-9999-9999-999999999999	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	dddddddd-dddd-dddd-dddd-dddddddddddd	Logo Concepts	Three logo concepts for review	file	in_review	https://test-bucket.scopeiq/deliverables/logo-concepts.png	\N	\N	\N	\N	0	2	\N	\N	2026-04-06 17:25:53.792395+00	2026-04-06 17:25:53.792395+00	\N	\N	\N	\N	2026-04-06 17:25:53.792395+00	\N
15f0b401-fe26-488f-835f-a5af2edbd136	ecd4d302-f038-42d9-b375-e4eff2b32e4d	f422ff64-94df-474b-9a9d-d83af69d36df	logo	\N	file	delivered	http://localhost:9000/scopeiq-assets/deliverables/ecd4d302-f038-42d9-b375-e4eff2b32e4d/15f0b401-fe26-488f-835f-a5af2edbd136/scopeiq_agency_userflow.svg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=scopeiq%2F20260406%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260406T182611Z&X-Amz-Expires=3600&X-Amz-Signature=b0de5e2094bc7be923b06fe24f3d663db8c8816f03436e3b0b0760f55954f869&X-Amz-SignedHeaders=host&x-id=GetObject	deliverables/ecd4d302-f038-42d9-b375-e4eff2b32e4d/15f0b401-fe26-488f-835f-a5af2edbd136/scopeiq_agency_userflow.svg	\N	\N	\N	0	10	\N	8336402b-cf82-48e2-9940-eb48bbc77020	2026-04-06 18:25:58.709752+00	2026-04-06 18:26:11.412+00	\N	b9103424-ab89-407e-aa0f-f8d83c758ae3	scopeiq_agency_userflow.svg	\N	2026-04-06 18:26:11.411+00	\N
f2fb638e-a8cf-4a12-aab4-f85b3a357dec	4ca7779e-4405-4809-a18f-72b35a362f3e	b3cfae09-7e92-4d55-a900-78f8a0204640	logo	\N	file	delivered	http://localhost:9000/scopeiq-assets/deliverables/4ca7779e-4405-4809-a18f-72b35a362f3e/f2fb638e-a8cf-4a12-aab4-f85b3a357dec/Generated%20Image%20April%2007%2C%202026%20-%208_10PM.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=scopeiq%2F20260411%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260411T235642Z&X-Amz-Expires=3600&X-Amz-Signature=28018f85626e303dde3c6663ffe03e7547cfb3f14a10bb911daaad2013719560&X-Amz-SignedHeaders=host&x-id=GetObject	deliverables/4ca7779e-4405-4809-a18f-72b35a362f3e/f2fb638e-a8cf-4a12-aab4-f85b3a357dec/Generated Image April 07, 2026 - 8_10PM.png	\N	\N	\N	0	3	\N	108160a2-d34f-4973-8f8b-0cb4544614c0	2026-04-11 23:56:28.555184+00	2026-04-11 23:56:42.234+00	\N	b2488eef-3f85-4dc7-9cf3-890dae122d21	Generated Image April 07, 2026 - 8_10PM.png	\N	2026-04-11 23:56:42.234+00	\N
\.


--
-- Data for Name: feedback_items; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.feedback_items (id, deliverable_id, author_id, author_name, source, body, annotation_json, created_at, resolved_at) FROM stdin;
5f8152dc-d7b4-4277-b45d-db4791a840d5	15f0b401-fe26-488f-835f-a5af2edbd136	\N	Client	portal	good	{"xPos": 0, "yPos": 0, "pinNumber": 1, "pageNumber": null}	2026-04-06 18:27:13.056051+00	\N
a949f342-2f27-4234-b818-fb35be8ad0cb	15f0b401-fe26-488f-835f-a5af2edbd136	8336402b-cf82-48e2-9940-eb48bbc77020	\N	manual_input	thanks	{"xPos": 0, "yPos": 0, "pinNumber": 2, "pageNumber": null}	2026-04-06 18:27:32.20424+00	\N
\.


--
-- Data for Name: invitations; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.invitations (id, workspace_id, email, role, token, invited_by, expires_at, accepted_at, created_at) FROM stdin;
\.


--
-- Data for Name: marketplace_installs; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.marketplace_installs (id, workspace_id, slug, brief_template_id, installed_by_user_id, installed_at) FROM stdin;
6d862158-a56b-4398-9d4d-5ba010fbb608	4ca7779e-4405-4809-a18f-72b35a362f3e	tpl-brand-identity	eccc4ef3-f2b1-4644-9dc9-f42b8cce8f19	108160a2-d34f-4973-8f8b-0cb4544614c0	2026-04-20 05:21:39.493951+00
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.projects (id, workspace_id, client_id, sow_id, name, description, status, budget, currency, start_date, end_date, portal_token, portal_enabled, created_at, updated_at, deleted_at) FROM stdin;
dddddddd-dddd-dddd-dddd-dddddddddddd	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	cccccccc-cccc-cccc-cccc-cccccccccccc	ffffffff-ffff-ffff-ffff-ffffffffffff	E2E Test Project	Project for end-to-end testing	active	30000	USD	\N	\N	\N	false	2026-04-06 17:25:53.792395+00	2026-04-06 17:25:53.792395+00	\N
f422ff64-94df-474b-9a9d-d83af69d36df	ecd4d302-f038-42d9-b375-e4eff2b32e4d	f5bf29fc-ea24-49a2-b88b-9618e38e9b2b	\N	Q4	\N	draft	\N	USD	\N	\N	8ef6f85fa262a6b1d4367d6405f2e5dde4b01b7843ce452eb8f667a616184d5c	false	2026-04-06 17:53:22.693156+00	2026-04-06 17:53:22.693156+00	\N
b3cfae09-7e92-4d55-a900-78f8a0204640	4ca7779e-4405-4809-a18f-72b35a362f3e	eab65f64-cfab-411d-89c5-2f499edfd641	\N	Rone	\N	draft	3400	USD	\N	\N	a231be0dbc5d0b0f79237d3b202a4e3b8fc07f14a0bb03ab19d5218f8c6e6323	false	2026-04-11 22:44:29.717563+00	2026-04-11 22:44:29.717563+00	\N
\.


--
-- Data for Name: rate_card_items; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.rate_card_items (id, workspace_id, name, description, unit, rate_in_cents, currency, created_at, updated_at, deleted_at) FROM stdin;
77777777-7777-7777-7777-777777777777	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	Additional Page Design	\N	page	50000	USD	2026-04-06 17:25:53.792395+00	2026-04-06 17:25:53.792395+00	\N
\.


--
-- Data for Name: reminder_logs; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.reminder_logs (id, deliverable_id, step, recipient_email, sent_at, sequence_step, delivery_status, opened_at) FROM stdin;
\.


--
-- Data for Name: scope_flags; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.scope_flags (id, workspace_id, project_id, sow_clause_id, severity, status, title, description, ai_reasoning, evidence, flagged_by, resolved_by, resolved_at, snoozed_until, created_at, updated_at, message_text, confidence, suggested_response, matching_clauses_json, sla_deadline, sla_breached) FROM stdin;
33333333-3333-3333-3333-333333333333	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	dddddddd-dddd-dddd-dddd-dddddddddddd	11111111-1111-1111-1111-111111111111	high	pending	AI Detection: Possible Scope Deviation	Request for mobile app and additional pages exceeds SOW scope.	Client is requesting a mobile app and 10 additional pages, which are not in the original SOW.	{}	\N	\N	\N	\N	2026-04-06 17:25:53.792395+00	2026-04-06 17:25:53.792395+00	Can you also design a mobile app version and add 10 more pages to the website?	0.92	Thank you for the suggestion. The mobile app and additional pages fall outside the current SOW.	[{"clause_id": "11111111-1111-1111-1111-111111111111", "relevance": 0.95, "clause_text": "Additional web pages beyond the agreed 5 pages are explicitly excluded"}]	\N	f
\.


--
-- Data for Name: sow_clauses; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.sow_clauses (id, sow_id, clause_type, original_text, summary, sort_order, created_at) FROM stdin;
11111111-1111-1111-1111-111111111111	ffffffff-ffff-ffff-ffff-ffffffffffff	exclusion	Additional web pages beyond the agreed 5 pages are explicitly excluded from this engagement.	Exclusion: no extra pages	0	2026-04-06 17:25:53.792395+00
22222222-2222-2222-2222-222222222222	ffffffff-ffff-ffff-ffff-ffffffffffff	revision_limit	Each deliverable includes 2 rounds of revisions. Additional rounds require a change order.	2 revision rounds per deliverable	0	2026-04-06 17:25:53.792395+00
\.


--
-- Data for Name: statements_of_work; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.statements_of_work (id, workspace_id, title, file_url, file_key, file_size_bytes, parsed_text_preview, parsing_result_json, parsed_at, created_at, updated_at, deleted_at, status) FROM stdin;
ffffffff-ffff-ffff-ffff-ffffffffffff	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	E2E Test SOW	https://test-bucket.scopeiq/sows/test-sow.pdf	\N	\N	Scope: 3 deliverables, 2 revision rounds, no additional pages	\N	\N	2026-04-06 17:25:53.792395+00	2026-04-06 17:25:53.792395+00	\N	draft
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.users (id, workspace_id, auth_uid, email, full_name, avatar_url, role, is_active, last_login_at, created_at, updated_at, deleted_at, user_type) FROM stdin;
bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb	owner@testagency.dev	Test Owner	\N	owner	t	\N	2026-04-06 17:25:53.792395+00	2026-04-06 17:25:53.792395+00	\N	agency
8336402b-cf82-48e2-9940-eb48bbc77020	ecd4d302-f038-42d9-b375-e4eff2b32e4d	7911c614-471e-4d8a-aab1-a4fa9c5c6fc4	syedsubhans132@gmail.com	Syed Subhan Shah	\N	owner	t	\N	2026-04-06 17:44:46.499475+00	2026-04-06 17:44:46.499475+00	\N	agency
108160a2-d34f-4973-8f8b-0cb4544614c0	4ca7779e-4405-4809-a18f-72b35a362f3e	4fa94e94-865e-430f-bcdb-c2f1d534cadd	syedsubhans132@gmail.com	Syed Subhan Shah	\N	owner	t	\N	2026-04-11 20:01:15.247543+00	2026-04-11 20:01:15.247543+00	\N	agency
b0bcca85-5f1e-45fd-b3c8-369c2adb3aa4	d2f9d484-82d9-43d9-a49d-952ba9fd0029	7c6b0490-f0f6-4d02-9dc8-65bdd47138b3	scopeiq.max@gmail.com	ScopeIQ	\N	owner	t	\N	2026-04-12 15:36:55.953443+00	2026-04-12 15:36:55.953443+00	\N	agency
\.


--
-- Data for Name: workspaces; Type: TABLE DATA; Schema: public; Owner: scopeiq
--

COPY public.workspaces (id, name, slug, plan, stripe_customer_id, stripe_subscription_id, logo_url, brand_color, custom_domain, settings_json, onboarding_progress, features, created_at, updated_at, deleted_at, secondary_color, brand_font, reminder_settings, domain_verification_status, domain_verification_token, domain_verified_at, domain_verification_attempted_at, brief_score_threshold, scope_guard_threshold, auto_hold_enabled, auto_approve_after_days) FROM stdin;
393bac10-abdb-47d9-a316-a526553a2e14	Novabots Studio	novabots-studio	studio	\N	\N	\N	#0F6E56	\N	{}	{}	{}	2026-04-03 21:08:19.398409+00	2026-04-03 21:08:19.398409+00	\N	#1D9E75	Inter	{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}	pending	\N	\N	\N	60	0.60	t	3
0d1b6f6e-4d66-40dd-b26f-c0a24d5d559f	syedsubhans132's Workspace	syedsubhans132-mnndlzyl	solo	\N	\N	\N	#0F6E56	\N	{}	{}	{}	2026-04-06 15:59:47.287771+00	2026-04-06 15:59:47.287771+00	\N	#1D9E75	Inter	{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}	pending	\N	\N	\N	60	0.60	t	3
f58120f6-aa55-4dc5-ab85-629595fcba2d	syedsubhans132's Workspace	syedsubhans132-mnndu7qq	solo	\N	\N	\N	#0F6E56	\N	{}	{}	{}	2026-04-06 16:06:10.613868+00	2026-04-06 16:06:10.613868+00	\N	#1D9E75	Inter	{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}	pending	\N	\N	\N	60	0.60	t	3
986a6e87-9115-48b3-841d-15d5d32e9f88	Novabots	novabots-mnk3cev7	solo	\N	\N	\N	#0F6E56	\N	{}	{"completedAt": "2026-04-04T15:28:09.831Z", "completedSteps": ["workspace_named", "first_client", "first_project", "brief_template", "portal_tour"]}	{}	2026-04-04 08:49:05.352004+00	2026-04-04 15:28:09.831+00	\N	#1D9E75	Inter	{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}	pending	\N	\N	\N	60	0.60	t	3
13687c58-1246-4a38-acd9-04def6bd3db6	syedsubhans132's Workspace	syedsubhans132-mnne2ldp	solo	\N	\N	\N	#0F6E56	\N	{}	{}	{}	2026-04-06 16:12:41.547949+00	2026-04-06 16:12:41.547949+00	\N	#1D9E75	Inter	{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}	pending	\N	\N	\N	60	0.60	t	3
f02be2af-a864-4409-a5e3-ff36b9475daa	syedsubhans132's Workspace	syedsubhans132-mnne2lej	solo	\N	\N	\N	#0F6E56	\N	{}	{}	{}	2026-04-06 16:12:41.567951+00	2026-04-06 16:12:41.567951+00	\N	#1D9E75	Inter	{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}	pending	\N	\N	\N	60	0.60	t	3
c8b61d29-e2e6-46a0-a6de-35afa010e26f	Insert	syedshahjee543-mnkhsifb	solo	\N	\N	\N	#0F6E56	\N	{}	{"completedAt": "2026-04-04T15:36:23.548Z", "completedSteps": ["workspace_named", "first_client", "first_project", "brief_template", "portal_tour"]}	{}	2026-04-04 15:33:31.080428+00	2026-04-04 15:36:23.548+00	\N	#1D9E75	Inter	{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}	pending	\N	\N	\N	60	0.60	t	3
ecd4d302-f038-42d9-b375-e4eff2b32e4d	Endrogen	syedsubhans132-mnnhd0gs	solo	\N	\N	\N	#0F6E56	\N	{}	{"completedAt": "2026-04-06T17:53:36.804Z", "completedSteps": ["workspace_named", "first_client", "first_project", "brief_template", "portal_tour"]}	{}	2026-04-06 17:44:46.492846+00	2026-04-06 17:53:36.804+00	\N	#1D9E75	Inter	{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}	pending	\N	\N	\N	60	0.60	t	3
e6e29c7d-6ec5-4068-9dbf-13e1064fea0b	Acme	scopeiq.max-mnkj7e8d	solo	\N	\N	\N	#0F6E56	\N	{}	{"completedAt": "2026-04-04T16:14:09.851Z", "completedSteps": ["workspace_named", "first_client", "first_project", "brief_template", "portal_tour"]}	{}	2026-04-04 16:13:05.105892+00	2026-04-04 16:14:09.851+00	\N	#1D9E75	Inter	{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}	pending	\N	\N	\N	60	0.60	t	3
f0479bea-7612-474b-8b33-5a6ccf98f1d5	Sinema	syedsubhans132-mnne2nsl	solo	\N	\N	\N	#0F6E56	\N	{}	{"completedAt": "2026-04-06T17:23:51.081Z", "completedSteps": ["workspace_named", "first_client", "first_project", "brief_template", "portal_tour"]}	{}	2026-04-06 16:12:44.663529+00	2026-04-06 17:23:51.081+00	\N	#1D9E75	Inter	{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}	pending	\N	\N	\N	60	0.60	t	3
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa	Test Agency	test-agency-e2e	studio	\N	\N	\N	#0F6E56	\N	{}	{}	{}	2026-04-06 17:25:53.792395+00	2026-04-06 17:25:53.792395+00	\N	#1D9E75	Inter	{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}	pending	\N	\N	\N	60	0.60	t	3
38cb9a9e-31b6-4385-9589-6b003d782739	syedsubhans132's Workspace	syedsubhans132-mnnhd0gt	solo	\N	\N	\N	#0F6E56	\N	{}	{}	{}	2026-04-06 17:44:46.494495+00	2026-04-06 17:44:46.494495+00	\N	#1D9E75	Inter	{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}	pending	\N	\N	\N	60	0.60	t	3
2c80a55b-f244-4e96-822a-d1b9e3718408	Google	novabots450-mnkjti40	solo	\N	\N	\N	#d5ece6	\N	{}	{"completedAt": "2026-04-04T16:32:41.857Z", "completedSteps": ["workspace_named", "first_client", "first_project", "brief_template", "portal_tour"]}	{}	2026-04-04 16:30:16.561627+00	2026-04-04 16:35:21.959+00	\N	#1D9E75	Inter	{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}	pending	\N	\N	\N	60	0.60	t	3
d2f9d484-82d9-43d9-a49d-952ba9fd0029	Acme	scopeiq.max-mnvxfptd	solo	\N	\N	\N	#0F6E56	\N	{}	{"completedAt": "2026-04-12T16:05:41.554Z", "completedSteps": ["workspace_named", "service_type", "brief_link", "sandbox"]}	{}	2026-04-12 15:36:55.925413+00	2026-04-12 16:05:41.554+00	\N	#1D9E75	Inter	{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}	pending	\N	\N	\N	60	0.60	t	3
dc1ddb5b-ac0a-415d-a766-757f0adbed00	Creatricx	syedsubhans132-mnndgqc0	solo	\N	\N	\N	#0F6E56	\N	{}	{"completedSteps": ["workspace_named", "first_client"]}	{}	2026-04-06 15:55:41.523439+00	2026-04-06 15:57:54.783+00	\N	#1D9E75	Inter	{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}	pending	\N	\N	\N	60	0.60	t	3
4ca7779e-4405-4809-a18f-72b35a362f3e	Acme	syedsubhans132-mnurfs9f	solo	\N	\N	\N	#0F6E56	\N	{}	{"completedAt": "2026-04-11T20:42:05.503Z", "completedSteps": ["workspace_named", "service_type", "brief_link", "sandbox"]}	{}	2026-04-11 20:01:15.226167+00	2026-04-11 20:42:05.503+00	\N	#1D9E75	Inter	{"step1Hours": 48, "step2Hours": 72, "step3Hours": 48}	pending	\N	\N	\N	60	0.60	t	3
\.


--
-- Name: approval_events approval_events_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.approval_events
    ADD CONSTRAINT approval_events_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: brief_attachments brief_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_attachments
    ADD CONSTRAINT brief_attachments_pkey PRIMARY KEY (id);


--
-- Name: brief_clarification_items brief_clarification_items_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_clarification_items
    ADD CONSTRAINT brief_clarification_items_pkey PRIMARY KEY (id);


--
-- Name: brief_clarification_requests brief_clarification_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_clarification_requests
    ADD CONSTRAINT brief_clarification_requests_pkey PRIMARY KEY (id);


--
-- Name: brief_fields brief_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_fields
    ADD CONSTRAINT brief_fields_pkey PRIMARY KEY (id);


--
-- Name: brief_template_versions brief_template_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_template_versions
    ADD CONSTRAINT brief_template_versions_pkey PRIMARY KEY (id);


--
-- Name: brief_templates brief_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_templates
    ADD CONSTRAINT brief_templates_pkey PRIMARY KEY (id);


--
-- Name: brief_versions brief_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_versions
    ADD CONSTRAINT brief_versions_pkey PRIMARY KEY (id);


--
-- Name: briefs briefs_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.briefs
    ADD CONSTRAINT briefs_pkey PRIMARY KEY (id);


--
-- Name: change_orders change_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.change_orders
    ADD CONSTRAINT change_orders_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: deliverable_revisions deliverable_revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.deliverable_revisions
    ADD CONSTRAINT deliverable_revisions_pkey PRIMARY KEY (id);


--
-- Name: deliverables deliverables_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.deliverables
    ADD CONSTRAINT deliverables_pkey PRIMARY KEY (id);


--
-- Name: feedback_items feedback_items_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.feedback_items
    ADD CONSTRAINT feedback_items_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_token_unique; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_token_unique UNIQUE (token);


--
-- Name: marketplace_installs marketplace_installs_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.marketplace_installs
    ADD CONSTRAINT marketplace_installs_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: projects projects_portal_token_unique; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_portal_token_unique UNIQUE (portal_token);


--
-- Name: rate_card_items rate_card_items_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.rate_card_items
    ADD CONSTRAINT rate_card_items_pkey PRIMARY KEY (id);


--
-- Name: reminder_logs reminder_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.reminder_logs
    ADD CONSTRAINT reminder_logs_pkey PRIMARY KEY (id);


--
-- Name: scope_flags scope_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.scope_flags
    ADD CONSTRAINT scope_flags_pkey PRIMARY KEY (id);


--
-- Name: sow_clauses sow_clauses_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.sow_clauses
    ADD CONSTRAINT sow_clauses_pkey PRIMARY KEY (id);


--
-- Name: statements_of_work statements_of_work_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.statements_of_work
    ADD CONSTRAINT statements_of_work_pkey PRIMARY KEY (id);


--
-- Name: marketplace_installs uq_marketplace_installs_workspace_slug; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.marketplace_installs
    ADD CONSTRAINT uq_marketplace_installs_workspace_slug UNIQUE (workspace_id, slug);


--
-- Name: users users_auth_uid_unique; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_auth_uid_unique UNIQUE (auth_uid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: workspaces workspaces_custom_domain_unique; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_custom_domain_unique UNIQUE (custom_domain);


--
-- Name: workspaces workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);


--
-- Name: workspaces workspaces_slug_unique; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_slug_unique UNIQUE (slug);


--
-- Name: workspaces workspaces_stripe_customer_id_unique; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_stripe_customer_id_unique UNIQUE (stripe_customer_id);


--
-- Name: workspaces workspaces_stripe_subscription_id_unique; Type: CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_stripe_subscription_id_unique UNIQUE (stripe_subscription_id);


--
-- Name: idx_approval_events_deliverable; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_approval_events_deliverable ON public.approval_events USING btree (deliverable_id);


--
-- Name: idx_audit_log_created; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_audit_log_created ON public.audit_log USING btree (workspace_id, created_at);


--
-- Name: idx_audit_log_entity; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_audit_log_entity ON public.audit_log USING btree (entity_type, entity_id);


--
-- Name: idx_audit_log_workspace; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_audit_log_workspace ON public.audit_log USING btree (workspace_id);


--
-- Name: idx_brief_attachments_brief; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_brief_attachments_brief ON public.brief_attachments USING btree (brief_id);


--
-- Name: idx_brief_attachments_brief_field; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_brief_attachments_brief_field ON public.brief_attachments USING btree (brief_id, field_key);


--
-- Name: idx_brief_clarification_items_request_order; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_brief_clarification_items_request_order ON public.brief_clarification_items USING btree (request_id, sort_order);


--
-- Name: idx_brief_clarification_requests_brief_status; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_brief_clarification_requests_brief_status ON public.brief_clarification_requests USING btree (brief_id, status);


--
-- Name: idx_brief_clarification_requests_workspace_brief; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_brief_clarification_requests_workspace_brief ON public.brief_clarification_requests USING btree (workspace_id, brief_id);


--
-- Name: idx_brief_fields_brief; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_brief_fields_brief ON public.brief_fields USING btree (brief_id);


--
-- Name: idx_brief_template_versions_template_version; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_brief_template_versions_template_version ON public.brief_template_versions USING btree (template_id, version_number);


--
-- Name: idx_brief_template_versions_workspace_template; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_brief_template_versions_workspace_template ON public.brief_template_versions USING btree (workspace_id, template_id);


--
-- Name: idx_brief_versions_brief_version; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_brief_versions_brief_version ON public.brief_versions USING btree (brief_id, version_number);


--
-- Name: idx_brief_versions_workspace_brief; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_brief_versions_workspace_brief ON public.brief_versions USING btree (workspace_id, brief_id);


--
-- Name: idx_briefs_project; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_briefs_project ON public.briefs USING btree (project_id);


--
-- Name: idx_briefs_project_version; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_briefs_project_version ON public.briefs USING btree (project_id, version DESC);


--
-- Name: idx_briefs_template_version; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_briefs_template_version ON public.briefs USING btree (template_version_id);


--
-- Name: idx_briefs_workspace_status; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_briefs_workspace_status ON public.briefs USING btree (workspace_id, status);


--
-- Name: idx_change_orders_project; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_change_orders_project ON public.change_orders USING btree (project_id);


--
-- Name: idx_change_orders_scope_flag; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_change_orders_scope_flag ON public.change_orders USING btree (scope_flag_id);


--
-- Name: idx_change_orders_workspace_status; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_change_orders_workspace_status ON public.change_orders USING btree (workspace_id, status);


--
-- Name: idx_clients_portal_token; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_clients_portal_token ON public.clients USING btree (portal_token);


--
-- Name: idx_deliverables_project; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_deliverables_project ON public.deliverables USING btree (project_id);


--
-- Name: idx_deliverables_workspace_status; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_deliverables_workspace_status ON public.deliverables USING btree (workspace_id, status);


--
-- Name: idx_feedback_items_deliverable; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_feedback_items_deliverable ON public.feedback_items USING btree (deliverable_id);


--
-- Name: idx_invitations_email_workspace; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_invitations_email_workspace ON public.invitations USING btree (email, workspace_id);


--
-- Name: idx_invitations_token; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_invitations_token ON public.invitations USING btree (token);


--
-- Name: idx_invitations_workspace; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_invitations_workspace ON public.invitations USING btree (workspace_id);


--
-- Name: idx_marketplace_installs_workspace; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_marketplace_installs_workspace ON public.marketplace_installs USING btree (workspace_id);


--
-- Name: idx_projects_client; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_projects_client ON public.projects USING btree (client_id);


--
-- Name: idx_projects_portal_token; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE UNIQUE INDEX idx_projects_portal_token ON public.projects USING btree (portal_token);


--
-- Name: idx_projects_workspace_status; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_projects_workspace_status ON public.projects USING btree (workspace_id, status);


--
-- Name: idx_rate_card_items_workspace; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_rate_card_items_workspace ON public.rate_card_items USING btree (workspace_id);


--
-- Name: idx_reminder_logs_deliverable; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_reminder_logs_deliverable ON public.reminder_logs USING btree (deliverable_id);


--
-- Name: idx_reminder_logs_step; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_reminder_logs_step ON public.reminder_logs USING btree (deliverable_id, sequence_step);


--
-- Name: idx_scope_flags_pending; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_scope_flags_pending ON public.scope_flags USING btree (project_id);


--
-- Name: idx_scope_flags_project; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_scope_flags_project ON public.scope_flags USING btree (project_id);


--
-- Name: idx_scope_flags_sla_breach; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_scope_flags_sla_breach ON public.scope_flags USING btree (sla_deadline) WHERE (status = ANY (ARRAY['pending'::public.flag_status_enum, 'confirmed'::public.flag_status_enum, 'snoozed'::public.flag_status_enum]));


--
-- Name: idx_scope_flags_workspace; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_scope_flags_workspace ON public.scope_flags USING btree (workspace_id);


--
-- Name: idx_scope_flags_workspace_status; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_scope_flags_workspace_status ON public.scope_flags USING btree (workspace_id, status);


--
-- Name: idx_sow_clauses_sow; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_sow_clauses_sow ON public.sow_clauses USING btree (sow_id);


--
-- Name: idx_sow_workspace; Type: INDEX; Schema: public; Owner: scopeiq
--

CREATE INDEX idx_sow_workspace ON public.statements_of_work USING btree (workspace_id);


--
-- Name: approval_events approval_events_deliverable_id_deliverables_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.approval_events
    ADD CONSTRAINT approval_events_deliverable_id_deliverables_id_fk FOREIGN KEY (deliverable_id) REFERENCES public.deliverables(id) ON DELETE CASCADE;


--
-- Name: audit_log audit_log_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);


--
-- Name: brief_attachments brief_attachments_brief_id_briefs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_attachments
    ADD CONSTRAINT brief_attachments_brief_id_briefs_id_fk FOREIGN KEY (brief_id) REFERENCES public.briefs(id) ON DELETE CASCADE;


--
-- Name: brief_attachments brief_attachments_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_attachments
    ADD CONSTRAINT brief_attachments_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);


--
-- Name: brief_clarification_items brief_clarification_items_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_clarification_items
    ADD CONSTRAINT brief_clarification_items_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.brief_clarification_requests(id) ON DELETE CASCADE;


--
-- Name: brief_clarification_requests brief_clarification_requests_brief_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_clarification_requests
    ADD CONSTRAINT brief_clarification_requests_brief_id_fkey FOREIGN KEY (brief_id) REFERENCES public.briefs(id) ON DELETE CASCADE;


--
-- Name: brief_clarification_requests brief_clarification_requests_brief_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_clarification_requests
    ADD CONSTRAINT brief_clarification_requests_brief_version_id_fkey FOREIGN KEY (brief_version_id) REFERENCES public.brief_versions(id) ON DELETE SET NULL;


--
-- Name: brief_clarification_requests brief_clarification_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_clarification_requests
    ADD CONSTRAINT brief_clarification_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id);


--
-- Name: brief_clarification_requests brief_clarification_requests_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_clarification_requests
    ADD CONSTRAINT brief_clarification_requests_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);


--
-- Name: brief_fields brief_fields_brief_id_briefs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_fields
    ADD CONSTRAINT brief_fields_brief_id_briefs_id_fk FOREIGN KEY (brief_id) REFERENCES public.briefs(id) ON DELETE CASCADE;


--
-- Name: brief_template_versions brief_template_versions_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_template_versions
    ADD CONSTRAINT brief_template_versions_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.users(id);


--
-- Name: brief_template_versions brief_template_versions_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_template_versions
    ADD CONSTRAINT brief_template_versions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.brief_templates(id) ON DELETE CASCADE;


--
-- Name: brief_template_versions brief_template_versions_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_template_versions
    ADD CONSTRAINT brief_template_versions_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);


--
-- Name: brief_templates brief_templates_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_templates
    ADD CONSTRAINT brief_templates_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);


--
-- Name: brief_versions brief_versions_brief_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_versions
    ADD CONSTRAINT brief_versions_brief_id_fkey FOREIGN KEY (brief_id) REFERENCES public.briefs(id) ON DELETE CASCADE;


--
-- Name: brief_versions brief_versions_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_versions
    ADD CONSTRAINT brief_versions_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- Name: brief_versions brief_versions_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.brief_versions
    ADD CONSTRAINT brief_versions_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);


--
-- Name: briefs briefs_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.briefs
    ADD CONSTRAINT briefs_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: briefs briefs_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.briefs
    ADD CONSTRAINT briefs_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- Name: briefs briefs_template_id_brief_templates_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.briefs
    ADD CONSTRAINT briefs_template_id_brief_templates_id_fk FOREIGN KEY (template_id) REFERENCES public.brief_templates(id);


--
-- Name: briefs briefs_template_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.briefs
    ADD CONSTRAINT briefs_template_version_id_fkey FOREIGN KEY (template_version_id) REFERENCES public.brief_template_versions(id);


--
-- Name: briefs briefs_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.briefs
    ADD CONSTRAINT briefs_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);


--
-- Name: change_orders change_orders_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.change_orders
    ADD CONSTRAINT change_orders_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: change_orders change_orders_scope_flag_id_scope_flags_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.change_orders
    ADD CONSTRAINT change_orders_scope_flag_id_scope_flags_id_fk FOREIGN KEY (scope_flag_id) REFERENCES public.scope_flags(id);


--
-- Name: change_orders change_orders_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.change_orders
    ADD CONSTRAINT change_orders_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);


--
-- Name: clients clients_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);


--
-- Name: deliverable_revisions deliverable_revisions_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.deliverable_revisions
    ADD CONSTRAINT deliverable_revisions_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: deliverable_revisions deliverable_revisions_deliverable_id_deliverables_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.deliverable_revisions
    ADD CONSTRAINT deliverable_revisions_deliverable_id_deliverables_id_fk FOREIGN KEY (deliverable_id) REFERENCES public.deliverables(id) ON DELETE CASCADE;


--
-- Name: deliverables deliverables_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.deliverables
    ADD CONSTRAINT deliverables_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: deliverables deliverables_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.deliverables
    ADD CONSTRAINT deliverables_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);


--
-- Name: feedback_items feedback_items_deliverable_id_deliverables_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.feedback_items
    ADD CONSTRAINT feedback_items_deliverable_id_deliverables_id_fk FOREIGN KEY (deliverable_id) REFERENCES public.deliverables(id) ON DELETE CASCADE;


--
-- Name: invitations invitations_invited_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_invited_by_users_id_fk FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: invitations invitations_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: marketplace_installs marketplace_installs_brief_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.marketplace_installs
    ADD CONSTRAINT marketplace_installs_brief_template_id_fkey FOREIGN KEY (brief_template_id) REFERENCES public.brief_templates(id) ON DELETE SET NULL;


--
-- Name: marketplace_installs marketplace_installs_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.marketplace_installs
    ADD CONSTRAINT marketplace_installs_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;


--
-- Name: projects projects_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: projects projects_sow_id_statements_of_work_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_sow_id_statements_of_work_id_fk FOREIGN KEY (sow_id) REFERENCES public.statements_of_work(id);


--
-- Name: projects projects_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);


--
-- Name: rate_card_items rate_card_items_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.rate_card_items
    ADD CONSTRAINT rate_card_items_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);


--
-- Name: reminder_logs reminder_logs_deliverable_id_deliverables_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.reminder_logs
    ADD CONSTRAINT reminder_logs_deliverable_id_deliverables_id_fk FOREIGN KEY (deliverable_id) REFERENCES public.deliverables(id) ON DELETE CASCADE;


--
-- Name: scope_flags scope_flags_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.scope_flags
    ADD CONSTRAINT scope_flags_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: scope_flags scope_flags_sow_clause_id_sow_clauses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.scope_flags
    ADD CONSTRAINT scope_flags_sow_clause_id_sow_clauses_id_fk FOREIGN KEY (sow_clause_id) REFERENCES public.sow_clauses(id);


--
-- Name: scope_flags scope_flags_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.scope_flags
    ADD CONSTRAINT scope_flags_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);


--
-- Name: sow_clauses sow_clauses_sow_id_statements_of_work_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.sow_clauses
    ADD CONSTRAINT sow_clauses_sow_id_statements_of_work_id_fk FOREIGN KEY (sow_id) REFERENCES public.statements_of_work(id) ON DELETE CASCADE;


--
-- Name: statements_of_work statements_of_work_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.statements_of_work
    ADD CONSTRAINT statements_of_work_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);


--
-- Name: users users_workspace_id_workspaces_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: scopeiq
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_workspace_id_workspaces_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);


--
-- PostgreSQL database dump complete
--

\unrestrict eQSPlEgdjLooyEsn3190I1wQWDzKccDftAmjq10tc1r3Sxjeu7pXlqWrd6wubRJ

