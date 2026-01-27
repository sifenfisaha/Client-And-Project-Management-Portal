import { Router } from 'express';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { projects, projectMembers, tasks, users } from '../db/schema.js';
import { generateId } from '../lib/ids.js';

const router = Router();

const stripSensitive = (user) => {
  if (!user) return user;
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

router.get('/', async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    if (workspaceId) {
      const items = await db
        .select()
        .from(projects)
        .where(eq(projects.workspaceId, workspaceId));
      return res.json(items);
    }
    const items = await db.select().from(projects);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, req.params.id))
      .limit(1);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const memberList = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, project.id));

    const taskList = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, project.id));

    const userIds = new Set([
      ...memberList.map((m) => m.userId),
      ...taskList.map((t) => t.assigneeId).filter(Boolean),
    ]);

    const userList = userIds.size
      ? await db
          .select()
          .from(users)
          .where(inArray(users.id, Array.from(userIds)))
      : [];

    const usersMap = Object.fromEntries(
      userList.map((u) => [u.id, stripSensitive(u)])
    );

    res.json({
      ...project,
      tasks: taskList.map((task) => ({
        ...task,
        assignee: task.assigneeId ? usersMap[task.assigneeId] : null,
        comments: [],
      })),
      members: memberList.map((member) => ({
        ...member,
        user: usersMap[member.userId] || null,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      workspaceId,
      name,
      description,
      priority,
      status,
      start_date,
      end_date,
      team_lead,
      progress,
    } = req.body;

    if (!workspaceId || !name || !priority || !status) {
      return res.status(400).json({
        message: 'workspaceId, name, priority, and status are required',
      });
    }

    const projectId = generateId('proj');

    await db.insert(projects).values({
      id: projectId,
      workspaceId,
      name,
      description: description || null,
      priority,
      status,
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      team_lead: team_lead || null,
      progress: typeof progress === 'number' ? progress : 0,
      updatedAt: new Date(),
    });

    const [created] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const updates = req.body;

    if (updates.start_date) updates.start_date = new Date(updates.start_date);
    if (updates.end_date) updates.end_date = new Date(updates.end_date);
    updates.updatedAt = new Date();

    await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, req.params.id));

    const [updated] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, req.params.id));

    res.json(updated || null);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.delete(projects).where(eq(projects.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/members', async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const memberId = generateId('pm');

    await db.insert(projectMembers).values({
      id: memberId,
      projectId: req.params.id,
      userId,
    });

    res.status(201).json({ id: memberId, projectId: req.params.id, userId });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/tasks', async (req, res, next) => {
  try {
    const taskList = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, req.params.id));

    res.json(taskList);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/tasks', async (req, res, next) => {
  try {
    const { title, description, status, type, priority, assigneeId, due_date } =
      req.body;

    if (!title || !status || !type || !priority) {
      return res
        .status(400)
        .json({ message: 'title, status, type, and priority are required' });
    }

    const taskId = generateId('task');

    await db.insert(tasks).values({
      id: taskId,
      projectId: req.params.id,
      title,
      description: description || null,
      status,
      type,
      priority,
      assigneeId: assigneeId || null,
      due_date: due_date ? new Date(due_date) : null,
      updatedAt: new Date(),
    });

    const [created] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

export default router;
