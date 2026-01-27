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
  invitations,
  comments,
} from './db/schema.js';

const run = async () => {
  await db.delete(comments);
  await db.delete(tasks);
  await db.delete(projectMembers);
  await db.delete(projects);
  await db.delete(workspaceMembers);
  await db.delete(invitations);
  await db.delete(workspaces);
  await db.delete(users);

  const adminPasswordHash = await bcrypt.hash('Password123', 10);

  await db.insert(users).values({
    id: 'user_admin',
    name: 'Admin',
    email: 'admin@admin.com',
    image: null,
    role: 'ADMIN',
    password_hash: adminPasswordHash,
  });

  await db.insert(workspaces).values({
    id: 'org_admin',
    name: 'Admin Workspace',
    slug: 'admin-workspace',
    description: null,
    settings: {},
    ownerId: 'user_admin',
    image_url: null,
  });

  await db.insert(workspaceMembers).values({
    id: 'wm_admin',
    workspaceId: 'org_admin',
    userId: 'user_admin',
    role: 'ADMIN',
    message: '',
  });
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
