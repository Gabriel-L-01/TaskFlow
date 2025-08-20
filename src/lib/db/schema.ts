
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const listTypeEnum = pgEnum('list_type', ['public', 'private', 'personal']);

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
    name: text('name').notNull().unique(),
    color: text('color'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    passwordHash: text('password_hash'),
    orderPosition: integer('order_position').default(0),
    owner_id: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }),
    type: listTypeEnum('type'),
  }
);

export const tags = pgTable('tags', {
  name: text('name').primaryKey(),
  color: text('color'),
  orderPosition: integer('order_position').default(0),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  done: boolean('done').default(false).notNull(),
  listId: uuid('list_id').references(() => lists.id, { onDelete: 'cascade' }),
  orderPosition: integer('order_position').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  tags: text('tags').array(),
  assignee_id: uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  due_date: timestamp('due_date', { withTimezone: true }),
});

export const presets = pgTable(
  'presets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    color: text('color'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    passwordHash: text('password_hash'),
    orderPosition: integer('order_position').default(0),
    owner_id: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }),
    type: listTypeEnum('type'),
  }
);

export const presetTasks = pgTable('preset_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  presetId: uuid('preset_id')
    .references(() => presets.id, { onDelete: 'cascade' })
    .notNull(),
  taskName: text('task_name').notNull(),
  description: text('description'),
  done: boolean('done').default(false),
  orderPosition: integer('order_position').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    content: text('content'),
    color: text('color'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    passwordHash: text('password_hash'),
    orderPosition: integer('order_position').default(0),
    owner_id: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }),
    type: listTypeEnum('type'),
    tags: text('tags').array(),
  }
);

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

export const userNoteAccess = pgTable(
  'user_note_access',
  {
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    noteId: uuid('note_id')
      .references(() => notes.id, { onDelete: 'cascade' })
      .notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.noteId] }),
    };
  }
);

// --- RELATIONS ---
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, {
    fields: [tasks.assignee_id],
    references: [users.id],
  }),
}));
