-- Checklista App - Zaktualizowany SQL Schema dla Neon PostgreSQL
-- Usuwamy tabele jeśli istnieją (w odwrotnej kolejności zależności)
DROP TABLE IF EXISTS public.user_preset_access CASCADE;
DROP TABLE IF EXISTS public.user_list_access CASCADE;
DROP TABLE IF EXISTS public.preset_tasks CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.presets CASCADE;
DROP TABLE IF EXISTS public.lists CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;


-- Tabela użytkowników
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    settings JSON NULL
) TABLESPACE pg_default;


-- Tabela list
CREATE TABLE public.lists (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    color text NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_private boolean DEFAULT false,
    password_hash text NULL,
    CONSTRAINT lists_pkey PRIMARY KEY (id),
    CONSTRAINT lists_name_key UNIQUE (name)
) TABLESPACE pg_default;


-- Tabela zadań
CREATE TABLE public.tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    done boolean NOT NULL DEFAULT false,
    list_id uuid NULL,
    order_position integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tasks_pkey PRIMARY KEY (id),
    CONSTRAINT tasks_list_id_fkey FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
) TABLESPACE pg_default;


-- Tabela presetów
CREATE TABLE public.presets (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    color text NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_private boolean DEFAULT false,
    password_hash text NULL,
    CONSTRAINT presets_pkey PRIMARY KEY (id),
    CONSTRAINT presets_name_key UNIQUE (name)
) TABLESPACE pg_default;


-- Tabela zadań w presetach
CREATE TABLE public.preset_tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    preset_id uuid NOT NULL,
    task_name text NOT NULL,
    done boolean DEFAULT false,
    order_position integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT preset_tasks_pkey PRIMARY KEY (id),
    CONSTRAINT preset_tasks_preset_id_fkey FOREIGN KEY (preset_id) REFERENCES presets(id) ON DELETE CASCADE
) TABLESPACE pg_default;


-- Tabela dostępu użytkowników do prywatnych list
CREATE TABLE public.user_list_access (
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    list_id uuid REFERENCES public.lists(id) ON DELETE CASCADE,
    granted_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id, list_id)
) TABLESPACE pg_default;


-- Tabela dostępu użytkowników do prywatnych presetów
CREATE TABLE public.user_preset_access (
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    preset_id uuid REFERENCES public.presets(id) ON DELETE CASCADE,
    granted_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (user_id, preset_id)
) TABLESPACE pg_default;


-- Indeksy dla lepszej wydajności
CREATE INDEX idx_tasks_list_id ON public.tasks(list_id);
CREATE INDEX idx_tasks_order ON public.tasks(order_position);
CREATE INDEX idx_tasks_done ON public.tasks(done);
CREATE INDEX idx_preset_tasks_preset_id ON public.preset_tasks(preset_id);
CREATE INDEX idx_preset_tasks_order ON public.preset_tasks(order_position);
CREATE INDEX idx_user_list_access ON public.user_list_access(user_id, list_id);
CREATE INDEX idx_user_preset_access ON public.user_preset_access(user_id, preset_id);


-- Skrzynka zadań = zadania z list_id = NULL


-- Przykładowe dane testowe (opcjonalne - usuń jeśli nie chcesz)

-- Przykładowy użytkownik
INSERT INTO public.users (username, email, password_hash) VALUES
    ('jan.kowalski', 'jan.kowalski@example.com', 'haslo_hash');

-- Przykładowe listy
INSERT INTO public.lists (name, color, is_private, password_hash) VALUES
    ('Praca', '#3b82f6', false, NULL),
    ('Dom', '#22c55e', false, NULL),
    ('Zakupy', '#f97316', true, 'haslo_zakupy_hash');

-- Przykładowe zadania
INSERT INTO public.tasks (name, list_id, order_position) VALUES
    ('Zadanie w skrzynce zadań', NULL, 1),
    ('Sprawdzić email', (SELECT id FROM public.lists WHERE name = 'Praca'), 1),
    ('Napisać raport', (SELECT id FROM public.lists WHERE name = 'Praca'), 2),
    ('Posprzątać pokój', (SELECT id FROM public.lists WHERE name = 'Dom'), 1),
    ('Kupić mleko', (SELECT id FROM public.lists WHERE name = 'Zakupy'), 1);

-- Przykładowe presety
INSERT INTO public.presets (name, color, is_private, password_hash) VALUES
    ('Nagrywanie', '#a855f7', false, NULL),
    ('Weekendowy Relaks', '#06b6d4', true, 'haslo_relaks_hash');

-- Przykładowe zadania w presetach
INSERT INTO public.preset_tasks (preset_id, task_name, order_position) VALUES
    ((SELECT id FROM public.presets WHERE name = 'Nagrywanie'), 'Przygotować mikrofon', 1),
    ((SELECT id FROM public.presets WHERE name = 'Nagrywanie'), 'Sprawdzić oświetlenie', 2),
    ((SELECT id FROM public.presets WHERE name = 'Weekendowy Relaks'), 'Pójść na spacer', 1),
    ((SELECT id FROM public.presets WHERE name = 'Weekendowy Relaks'), 'Obejrzeć film', 2);

-- Nadanie dostępu użytkownikowi do prywatnej listy i presetu
INSERT INTO public.user_list_access (user_id, list_id) VALUES
    ((SELECT id FROM public.users WHERE username = 'jan.kowalski'), (SELECT id FROM public.lists WHERE name = 'Zakupy'));

INSERT INTO public.user_preset_access (user_id, preset_id) VALUES
    ((SELECT id FROM public.users WHERE username = 'jan.kowalski'), (SELECT id FROM public.presets WHERE name = 'Weekendowy Relaks'));