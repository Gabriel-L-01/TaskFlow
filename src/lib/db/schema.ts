
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  primaryKey,
  jsonb,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  settings: jsonb('settings'),
});

export const lists = pgTable(
  'lists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    color: text('color'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    isPrivate: boolean('is_private').default(false),
    passwordHash: text('password_hash'),
  },
  (table) => {
    return {
      nameKey: uniqueIndex('lists_name_key').on(table.name),
    };
  }
);

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  done: boolean('done').default(false).notNull(),
  listId: uuid('list_id').references(() => lists.id, { onDelete: 'cascade' }),
  orderPosition: integer('order_position').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const presets = pgTable(
  'presets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    color: text('color'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    isPrivate: boolean('is_private').default(false),
    passwordHash: text('password_hash'),
  },
  (table) => {
    return {
      presetsNameKey: uniqueIndex('presets_name_key').on(table.name),
    };
  }
);

export const presetTasks = pgTable('preset_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  presetId: uuid('preset_id')
    .references(() => presets.id, { onDelete: 'cascade' })
    .notNull(),
  taskName: text('task_name').notNull(),
  done: boolean('done').default(false),
  orderPosition: integer('order_position').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Join table for user access to private lists
export const userListAccess = pgTable(
  'user_list_access',
  {
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    listId: uuid('list_id')
      .references(() => lists.id, { onDelete: 'cascade' })
      .notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.listId] }),
    };
  }
);

// Join table for user access to private presets
export const userPresetAccess = pgTable(
  'user_preset_access',
  {
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    presetId: uuid('preset_id')
      .references(() => presets.id, { onDelete: 'cascade' })
      .notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.presetId] }),
    };
  }
);
