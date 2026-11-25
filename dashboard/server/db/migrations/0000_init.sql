CREATE SEQUENCE "public"."contact_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1001 CACHE 1;--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"entity" text,
	"entity_id" text,
	"details" jsonb,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" integer NOT NULL,
	"utm_campaign" text NOT NULL,
	"name" text NOT NULL,
	"placement" text,
	"external_id" text,
	"starts_on" date,
	"ends_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_utm_campaign_unique" UNIQUE("utm_campaign"),
	CONSTRAINT "campaigns_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"cost_mode" text DEFAULT 'manual' NOT NULL,
	"commission_percent" numeric(5, 2) DEFAULT 0 NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"color" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "channels_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"industry_id" integer,
	"contact_name" text,
	"phone" text,
	"telegram" text,
	"telegram_user_id" text,
	"whatsapp" text,
	"instagram" text,
	"email" text,
	"first_channel_id" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"visitor_id" uuid,
	"channel" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"clicked_at" timestamp with time zone,
	"used_at" timestamp with time zone,
	"deal_id" integer
);
--> statement-breakpoint
CREATE TABLE "deal_costs" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL,
	"category" text NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"currency" text NOT NULL,
	"uzs_per_unit" numeric(18, 6) NOT NULL,
	"uzs_per_usd" numeric(18, 6) NOT NULL,
	"spent_on" date NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"visitor_id" uuid,
	"title" text,
	"contact_name" text,
	"stage_id" integer NOT NULL,
	"amount" numeric(16, 2),
	"currency" text DEFAULT 'USD' NOT NULL,
	"service_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expected_close_on" date,
	"owner_id" integer,
	"loss_reason_id" integer,
	"loss_comment" text,
	"is_repeat" boolean DEFAULT false NOT NULL,
	"origin" text DEFAULT 'manual' NOT NULL,
	"contact_method" text,
	"first_channel_id" integer,
	"last_channel_id" integer,
	"campaign_id" integer,
	"first_touch" jsonb,
	"last_touch" jsonb,
	"contact_code" text,
	"language" text,
	"page" text,
	"device" text,
	"telegram_chat_id" text,
	"instagram_thread_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"first_response_at" timestamp with time zone,
	"stage_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_prepayment_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"unanswered_notified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"visitor_id" uuid NOT NULL,
	"visit_id" uuid,
	"at" timestamp with time zone NOT NULL,
	"name" text NOT NULL,
	"page" text,
	"params" jsonb,
	"active_seconds" integer
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"spent_on" date NOT NULL,
	"channel_id" integer NOT NULL,
	"campaign_id" integer,
	"amount" numeric(16, 2) NOT NULL,
	"currency" text NOT NULL,
	"uzs_per_unit" numeric(18, 6) NOT NULL,
	"uzs_per_usd" numeric(18, 6) NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"external_key" text,
	"impressions" integer,
	"clicks" integer,
	"comment" text,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_external_key_unique" UNIQUE("external_key")
);
--> statement-breakpoint
CREATE TABLE "fx_rates" (
	"day" date NOT NULL,
	"currency" text NOT NULL,
	"uzs_per_unit" numeric(18, 6) NOT NULL,
	CONSTRAINT "fx_rates_day_currency_pk" PRIMARY KEY("day","currency")
);
--> statement-breakpoint
CREATE TABLE "industries" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "industries_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "instagram_stats" (
	"day" date PRIMARY KEY NOT NULL,
	"followers" integer,
	"reach" integer,
	"link_clicks" integer
);
--> statement-breakpoint
CREATE TABLE "integration_status" (
	"provider" text PRIMARY KEY NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"last_error" text,
	"details" jsonb,
	"alerted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"key" text PRIMARY KEY NOT NULL,
	"ran_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loss_reasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"key" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"deal_id" integer,
	"channel" text NOT NULL,
	"direction" text NOT NULL,
	"text" text,
	"sender_name" text,
	"external_id" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	CONSTRAINT "messages_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL,
	"text" text NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL,
	"kind" text NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"currency" text NOT NULL,
	"uzs_per_unit" numeric(18, 6) NOT NULL,
	"uzs_per_usd" numeric(18, 6) NOT NULL,
	"paid_on" date NOT NULL,
	"method" text NOT NULL,
	"commission_percent" numeric(5, 2) DEFAULT 0 NOT NULL,
	"note" text,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"month" date PRIMARY KEY NOT NULL,
	"leads" integer,
	"revenue" numeric(16, 2),
	"currency" text DEFAULT 'USD' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "secrets" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'service' NOT NULL,
	"base_price" numeric(16, 2),
	"currency" text DEFAULT 'USD' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "services_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stage" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stage_history" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL,
	"from_stage_id" integer,
	"to_stage_id" integer NOT NULL,
	"user_id" integer,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"kind" text DEFAULT 'open' NOT NULL,
	"requires_payment" boolean DEFAULT false NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	CONSTRAINT "stages_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer,
	"text" text NOT NULL,
	"due_on" date,
	"done" boolean DEFAULT false NOT NULL,
	"done_at" timestamp with time zone,
	"assignee_id" integer,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_chat_id" text,
	"user_id" text,
	"username" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"can_reply" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'owner' NOT NULL,
	"password_hash" text NOT NULL,
	"totp_secret" text,
	"totp_enabled" boolean DEFAULT false NOT NULL,
	"telegram_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_touch" jsonb,
	"last_touch" jsonb,
	"first_channel_id" integer,
	"last_channel_id" integer,
	"ga_client_id" text,
	"ym_client_id" text,
	"fbp" text,
	"fbc" text,
	"device" text,
	"language" text,
	"is_bot" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY NOT NULL,
	"visitor_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"touch" jsonb,
	"channel_id" integer,
	"campaign" text,
	"landing" text,
	"device" text,
	"language" text,
	"user_agent" text,
	"is_bot" boolean DEFAULT false NOT NULL,
	"page_views" integer DEFAULT 0 NOT NULL,
	"active_seconds" integer DEFAULT 0 NOT NULL,
	"max_scroll" integer DEFAULT 0 NOT NULL,
	"interacted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_first_channel_id_channels_id_fk" FOREIGN KEY ("first_channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_costs" ADD CONSTRAINT "deal_costs_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_loss_reason_id_loss_reasons_id_fk" FOREIGN KEY ("loss_reason_id") REFERENCES "public"."loss_reasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_first_channel_id_channels_id_fk" FOREIGN KEY ("first_channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_last_channel_id_channels_id_fk" FOREIGN KEY ("last_channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_from_stage_id_stages_id_fk" FOREIGN KEY ("from_stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_to_stage_id_stages_id_fk" FOREIGN KEY ("to_stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_first_channel_id_channels_id_fk" FOREIGN KEY ("first_channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_last_channel_id_channels_id_fk" FOREIGN KEY ("last_channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "clients_phone_idx" ON "clients" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "clients_telegram_idx" ON "clients" USING btree (lower("telegram"));--> statement-breakpoint
CREATE INDEX "contact_codes_visitor_idx" ON "contact_codes" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "deals_created_idx" ON "deals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "deals_stage_idx" ON "deals" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "deals_client_idx" ON "deals" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "deals_tg_chat_idx" ON "deals" USING btree ("telegram_chat_id");--> statement-breakpoint
CREATE INDEX "events_at_idx" ON "events" USING btree ("at");--> statement-breakpoint
CREATE INDEX "events_visitor_idx" ON "events" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "events_name_at_idx" ON "events" USING btree ("name","at");--> statement-breakpoint
CREATE INDEX "expenses_spent_idx" ON "expenses" USING btree ("spent_on");--> statement-breakpoint
CREATE INDEX "messages_deal_idx" ON "messages" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "payments_paid_idx" ON "payments" USING btree ("paid_on");--> statement-breakpoint
CREATE INDEX "payments_deal_idx" ON "payments" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "stage_history_deal_idx" ON "stage_history" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "tasks_due_idx" ON "tasks" USING btree ("due_on");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "visitors_created_idx" ON "visitors" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "visits_started_idx" ON "visits" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "visits_visitor_idx" ON "visits" USING btree ("visitor_id");