-- Enum Types
DO $$ BEGIN
    CREATE TYPE list_type AS ENUM ('list', 'project');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table Definitions
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"settings" jsonb,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"is_private" boolean DEFAULT false,
	"password_hash" text,
	"order_position" integer DEFAULT 0,
	"owner_id" uuid,
	"type" list_type,
	CONSTRAINT "lists_name_unique" UNIQUE("name")
);

CREATE TABLE IF NOT EXISTS "tags" (
	"name" text PRIMARY KEY NOT NULL,
	"color" text,
	"order_position" integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"done" boolean DEFAULT false NOT NULL,
	"list_id" uuid,
	"order_position" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"tags" text[]
);

CREATE TABLE IF NOT EXISTS "presets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"is_private" boolean DEFAULT false,
	"password_hash" text,
	"order_position" integer DEFAULT 0,
	"owner_id" uuid,
	"type" list_type,
	CONSTRAINT "presets_name_unique" UNIQUE("name")
);

CREATE TABLE IF NOT EXISTS "preset_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"preset_id" uuid NOT NULL,
	"task_name" text NOT NULL,
	"done" boolean DEFAULT false,
	"order_position" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_list_access" (
	"user_id" uuid NOT NULL,
	"list_id" uuid NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_list_access_user_id_list_id_pk" PRIMARY KEY("user_id","list_id")
);

CREATE TABLE IF NOT EXISTS "user_preset_access" (
	"user_id" uuid NOT NULL,
	"preset_id" uuid NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_preset_access_user_id_preset_id_pk" PRIMARY KEY("user_id","preset_id")
);

-- Foreign Keys
DO $$ BEGIN
 ALTER TABLE "lists" ADD CONSTRAINT "lists_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "presets" ADD CONSTRAINT "presets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "preset_tasks" ADD CONSTRAINT "preset_tasks_preset_id_presets_id_fk" FOREIGN KEY ("preset_id") REFERENCES "presets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_list_access" ADD CONSTRAINT "user_list_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_list_access" ADD CONSTRAINT "user_list_access_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_preset_access" ADD CONSTRAINT "user_preset_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_preset_access" ADD CONSTRAINT "user_preset_access_preset_id_presets_id_fk" FOREIGN KEY ("preset_id") REFERENCES "presets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Sample Data
-- Note: Replace UUIDs with actual ones if needed for consistency
DO $$
DECLARE
    user1_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    list1_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    list2_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
    preset1_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
BEGIN
    -- Clear existing data
    DELETE FROM "tasks";
    DELETE FROM "preset_tasks";
    DELETE FROM "user_list_access";
    DELETE FROM "user_preset_access";
    DELETE FROM "lists";
    DELETE FROM "presets";
    DELETE FROM "tags";
    DELETE FROM "users";

    -- Users
    INSERT INTO "users" (id, username, email, password_hash, settings) VALUES
    (user1_id, 'demo_user', 'demo@example.com', '$2a$12$s.k1v6kY.E5as5cf4jV8/uRts.aD/q3R.2gC.mAPgP7p.u3pZz5mS', '{"theme": "dark", "language": "pl", "hideLocked": false, "colorTheme": "default", "groupByList": false, "showCompleted": true, "showTags": true, "workMode": "lists"}'); -- password is "password"

    -- Tags
    INSERT INTO "tags" (name, color, order_position) VALUES
    ('Pilne', '#ef4444', 0),
    ('Praca', '#3b82f6', 1),
    ('Dom', '#22c55e', 2);

    -- Lists
    INSERT INTO "lists" (id, name, color, is_private, owner_id, type, order_position) VALUES
    (list1_id, 'Zakupy', '#f97316', false, user1_id, 'list', 0),
    (list2_id, 'Projekt X', '#a855f7', false, user1_id, 'project', 1);

    -- Tasks
    INSERT INTO "tasks" (id, name, description, done, list_id, order_position, tags) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Kupić mleko', 'Mleko 2%', false, list1_id, 0, ARRAY['Dom']),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'Kupić chleb', NULL, false, list1_id, 1, ARRAY['Dom']),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', 'Zaprojektować UI', 'Użyć Figmy', false, list2_id, 0, ARRAY['Praca', 'Pilne']),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', 'Stworzyć endpoint API', NULL, true, list2_id, 1, ARRAY['Praca']);

    -- Presets
    INSERT INTO "presets" (id, name, color, is_private, owner_id, type, order_position) VALUES
    (preset1_id, 'Poranna rutyna', '#eab308', false, user1_id, 'list', 0);

    -- Preset Tasks
    INSERT INTO "preset_tasks" (id, preset_id, task_name, done, order_position) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', preset1_id, 'Pościelić łóżko', false, 0),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', preset1_id, 'Medytacja 10 min', false, 1);

    -- User Access (example for private items if any were created)
    -- INSERT INTO "user_list_access" (user_id, list_id) VALUES (user1_id, 'some_private_list_id');

END $$;
