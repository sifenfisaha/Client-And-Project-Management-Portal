import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { workspaceMembers } from '../db/schema.js';

export const isWorkspaceAdmin = async (userId, workspaceId) => {
  if (!userId) return false;
  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      )
    )
    .limit(1);

  return member?.role === 'ADMIN';
};
