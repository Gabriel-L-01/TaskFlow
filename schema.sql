-- Custom Types
CREATE TYPE "list_type" AS ENUM ('public', 'private', 'personal');

-- Tables
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" text UNIQUE NOT NULL,
  "email" text UNIQUE NOT NULL,
  "password_hash" text NOT NULL,
  "created_at" timestamptz DEFAULT (now()),
  "settings" jsonb
);

CREATE TABLE "lists" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text UNIQUE NOT NULL,
  "color" text,
  "created_at" timestamptz DEFAULT (now()),
  "is_private" boolean DEFAULT false,
  "password_hash" text,
  "order_position" integer DEFAULT 0,
  "owner_id" uuid,
  "type" list_type
);

CREATE TABLE "tags" (
  "name" text PRIMARY KEY,
  "color" text,
  "order_position" integer DEFAULT 0
);

CREATE TABLE "tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "description" text,
  "done" boolean NOT NULL DEFAULT false,
  "list_id" uuid,
  "order_position" integer DEFAULT 0,
  "created_at" timestamptz DEFAULT (now()),
  "tags" text[]
);

CREATE TABLE "presets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text UNIQUE NOT NULL,
  "color" text,
  "created_at" timestamptz DEFAULT (now()),
  "is_private" boolean DEFAULT false,
  "password_hash" text,
  "order_position" integer DEFAULT 0,
  "owner_id" uuid,
  "type" list_type
);

CREATE TABLE "preset_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "preset_id" uuid NOT NULL,
  "task_name" text NOT NULL,
  "done" boolean DEFAULT false,
  "order_position" integer DEFAULT 0,
  "created_at" timestamptz DEFAULT (now())
);

CREATE TABLE "user_list_access" (
  "user_id" uuid NOT NULL,
  "list_id" uuid NOT NULL,
  "granted_at" timestamptz DEFAULT (now()),
  PRIMARY KEY ("user_id", "list_id")
);

CREATE TABLE "user_preset_access" (
  "user_id" uuid NOT NULL,
  "preset_id" uuid NOT NULL,
  "granted_at" timestamptz DEFAULT (now()),
  PRIMARY KEY ("user_id", "preset_id")
);

-- Foreign Keys
ALTER TABLE "lists" ADD FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "tasks" ADD FOREIGN KEY ("list_id") REFERENCES "lists" ("id") ON DELETE CASCADE;
ALTER TABLE "presets" ADD FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "preset_tasks" ADD FOREIGN KEY ("preset_id") REFERENCES "presets" ("id") ON DELETE CASCADE;
ALTER TABLE "user_list_access" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "user_list_access" ADD FOREIGN KEY ("list_id") REFERENCES "lists" ("id") ON DELETE CASCADE;
ALTER TABLE "user_preset_access" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "user_preset_access" ADD FOREIGN KEY ("preset_id") REFERENCES "presets" ("id") ON DELETE CASCADE;

-- Indexes
CREATE INDEX ON "tasks" ("list_id");
CREATE INDEX ON "preset_tasks" ("preset_id");

-- Sample Data
INSERT INTO "users" ("id", "username", "email", "password_hash") VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sample_user', 'user@example.com', '$2a$10$f/.B.XXa2.123456789012345678901');

INSERT INTO "lists" ("id", "name", "color", "is_private", "password_hash", "order_position", "owner_id", "type") VALUES
('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed', 'Shopping List', '#ef4444', false, NULL, 0, NULL, 'public'),
('2c8e7afc-cec8-4f5a-a8f8-bde94f4b3e3d', 'Work Projects', '#3b82f6', true, '$2a$10$f/.B.XXa2.123456789012345678901', 1, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'private');

INSERT INTO "presets" ("id", "name", "color", "is_private", "password_hash", "order_position", "owner_id", "type") VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Morning Routine', '#eab308', false, NULL, 0, NULL, 'public');

INSERT INTO "tags" ("name", "color", "order_position") VALUES
('Urgent', '#ef4444', 0),
('Work', '#3b82f6', 1),
('Home', '#22c55e', 2);

INSERT INTO "tasks" ("id", "name", "description", "done", "list_id", "order_position", "tags") VALUES
('3d7f9c4b-7c4a-4b8e-8e4a-9b4c8d5e6f7a', 'Buy milk', '2% milk', false, '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed', 0, ARRAY['Home']),
('4e8g0d5c-8d5b-5c9f-9f5b-ac9dfccf5e4e', 'Finish Q3 report', 'Review numbers and finalize presentation', false, '2c8e7afc-cec8-4f5a-a8f8-bde94f4b3e3d', 0, ARRAY['Urgent', 'Work']);

INSERT INTO "preset_tasks" ("preset_id", "task_name", "done", "order_position") VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Make bed', false, 0),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Brush teeth', false, 1);
