
'use server';

import { db } from '@/lib/db';
import type { User } from '@/lib/types';
import { users, userListAccess, lists } from '@/lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';


export async function getUsers(): Promise<User[]> {
    const allUsers = await db.query.users.findMany();

    return allUsers.map(u => ({
        id: u.id,
        username: u.username,
        settings: u.settings as any
    }));
}

export async function getUsersForList(listId: string | null): Promise<User[]> {
    if (!listId) {
        // Inbox or 'All Tasks' - return all users
        return getUsers();
    }

    const list = await db.query.lists.findFirst({ where: eq(lists.id, listId) });
    if (!list) {
        return [];
    }

    if (list.type === 'public') {
        return getUsers();
    }

    if (list.type === 'personal') {
        if (!list.owner_id) return [];
        const owner = await db.query.users.findFirst({ where: eq(users.id, list.owner_id) });
        return owner ? [{ id: owner.id, username: owner.username, settings: owner.settings as any }] : [];
    }

    if (list.type === 'private') {
        const usersWithAccess = await db
            .select({
                id: users.id,
                username: users.username,
                settings: users.settings,
            })
            .from(users)
            .innerJoin(userListAccess, eq(users.id, userListAccess.userId))
            .where(eq(userListAccess.listId, listId));
        
        return usersWithAccess.map(u => ({ id: u.id, username: u.username, settings: u.settings as any }));
    }

    return [];
}
