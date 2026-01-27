import { Router } from 'express';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { comments, tasks, users } from '../db/schema.js';
import { generateId } from '../lib/ids.js';

const router = Router();

const stripSensitive = (user) => {
  if (!user) return user;
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

router.get('/:id', async (req, res, next) => {
  try {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, req.params.id))
      .limit(1);

    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json(task);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const updates = req.body;
    if (updates.due_date) updates.due_date = new Date(updates.due_date);
    updates.updatedAt = new Date();

    await db.update(tasks).set(updates).where(eq(tasks.id, req.params.id));

    const [updated] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, req.params.id));

    res.json(updated || null);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.delete(tasks).where(eq(tasks.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/:id/comments', async (req, res, next) => {
  try {
    const taskComments = await db
      .select()
      .from(comments)
      .where(eq(comments.taskId, req.params.id));
    const userIds = taskComments.map((c) => c.userId);
    const userList = userIds.length
      ? await db.select().from(users).where(inArray(users.id, userIds))
      : [];

    const usersMap = Object.fromEntries(
      userList.map((u) => [u.id, stripSensitive(u)])
    );

    res.json(
      taskComments.map((comment) => ({
        ...comment,
        user: usersMap[comment.userId] || null,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.post('/:id/comments', async (req, res, next) => {
  try {
    const { userId, content } = req.body;
    if (!userId || !content) {
      return res
        .status(400)
        .json({ message: 'userId and content are required' });
    }

    const commentId = generateId('cmt');

    await db.insert(comments).values({
      id: commentId,
      taskId: req.params.id,
      userId,
      content,
    });

    const [created] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    res.status(201).json({
      ...created,
      user: stripSensitive(user) || null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
