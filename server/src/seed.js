import 'dotenv/config';
import { db } from './db/index.js';
import bcrypt from 'bcryptjs';
import {
  users,
  workspaces,
  workspaceMembers,
  projects,
  projectMembers,
  tasks,
} from './db/schema.js';

const run = async () => {
  await db.delete(tasks);
  await db.delete(projectMembers);
  await db.delete(projects);
  await db.delete(workspaceMembers);
  await db.delete(workspaces);
  await db.delete(users);

  const adminPasswordHash = await bcrypt.hash('Password123', 10);

  await db.insert(users).values([
    {
      id: 'user_1',
      name: 'Alex Smith',
      email: 'alexsmith@example.com',
      image: null,
      role: 'USER',
    },
    {
      id: 'user_2',
      name: 'John Warrel',
      email: 'johnwarrel@example.com',
      image: null,
      role: 'USER',
    },
    {
      id: 'user_3',
      name: 'Oliver Watts',
      email: 'oliverwatts@example.com',
      image: null,
      role: 'USER',
    },
    {
      id: 'user_admin',
      name: 'Admin',
      email: 'admin@admin.com',
      image: null,
      role: 'ADMIN',
      password_hash: adminPasswordHash,
    },
  ]);

  await db.insert(workspaces).values({
    id: 'org_1',
    name: 'Corp Workspace',
    slug: 'corp-workspace',
    description: null,
    settings: {},
    ownerId: 'user_3',
    image_url: null,
  });

  await db.insert(workspaceMembers).values([
    {
      id: 'wm_1',
      workspaceId: 'org_1',
      userId: 'user_1',
      role: 'ADMIN',
      message: '',
    },
    {
      id: 'wm_2',
      workspaceId: 'org_1',
      userId: 'user_2',
      role: 'ADMIN',
      message: '',
    },
    {
      id: 'wm_3',
      workspaceId: 'org_1',
      userId: 'user_3',
      role: 'ADMIN',
      message: '',
    },
    {
      id: 'wm_admin',
      workspaceId: 'org_1',
      userId: 'user_admin',
      role: 'ADMIN',
      message: '',
    },
  ]);

  await db.insert(projects).values({
    id: 'proj_1',
    workspaceId: 'org_1',
    name: 'LaunchPad CRM',
    description:
      'A next-gen CRM for startups to manage customer pipelines, analytics, and automation.',
    priority: 'HIGH',
    status: 'ACTIVE',
    start_date: new Date('2025-10-10T00:00:00.000Z'),
    end_date: new Date('2026-02-28T00:00:00.000Z'),
    team_lead: 'user_3',
    progress: 65,
  });

  await db.insert(projectMembers).values([
    { id: 'pm_1', projectId: 'proj_1', userId: 'user_1' },
    { id: 'pm_2', projectId: 'proj_1', userId: 'user_2' },
    { id: 'pm_3', projectId: 'proj_1', userId: 'user_3' },
  ]);

  await db.insert(tasks).values([
    {
      id: 'task_1',
      projectId: 'proj_1',
      title: 'Design Dashboard UI',
      description: 'Create a modern, responsive CRM dashboard layout.',
      status: 'IN_PROGRESS',
      type: 'FEATURE',
      priority: 'HIGH',
      assigneeId: 'user_1',
      due_date: new Date('2025-10-31T00:00:00.000Z'),
    },
    {
      id: 'task_2',
      projectId: 'proj_1',
      title: 'Integrate Email API',
      description: 'Set up SendGrid integration for email campaigns.',
      status: 'TODO',
      type: 'TASK',
      priority: 'MEDIUM',
      assigneeId: 'user_2',
      due_date: new Date('2025-11-30T00:00:00.000Z'),
    },
  ]);
};

run()
  .then(() => {
    console.log('Seed complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
