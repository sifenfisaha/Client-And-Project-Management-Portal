import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  invitations,
  projectMembers,
  users,
  workspaceMembers,
} from '../db/schema.js';
import { generateId } from '../lib/ids.js';
import { requireAuth } from '../middleware/auth.js';
import { isWorkspaceAdmin } from '../lib/permissions.js';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const stripSensitive = (user) => {
  if (!user) return user;
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

const buildInviteLink = (token) => {
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
  return `${baseUrl}/accept-invite?token=${token}`;
};

router.get('/lookup', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'token is required' });

    const [invite] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);

    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    if (invite.acceptedAt) {
      return res.status(400).json({ message: 'Invite already accepted' });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'Invite expired' });
    }

    res.json({
      email: invite.email,
      role: invite.role,
      workspaceId: invite.workspaceId,
      projectId: invite.projectId,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/test', (req, res) => {
  return res.json({ message: 'Invitations route is working' });
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { email, role, workspaceId, projectId } = req.body;

    if (!email || !role || !workspaceId) {
      return res
        .status(400)
        .json({ message: 'email, role, and workspaceId are required' });
    }

    if (role === 'MEMBER' && !projectId) {
      return res
        .status(400)
        .json({ message: 'projectId is required for member invites' });
    }

    const isAdmin =
      req.user.role === 'ADMIN' ||
      (await isWorkspaceAdmin(req.user.id, workspaceId));
    if (!isAdmin) return res.status(403).json({ message: 'Forbidden' });

    const token = crypto.randomBytes(24).toString('hex');
    const inviteId = generateId('invite');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await db.insert(invitations).values({
      id: inviteId,
      email: email.toLowerCase(),
      token,
      role,
      workspaceId,
      projectId: projectId || null,
      invitedBy: req.user.id,
      expiresAt,
    });

    const inviteLink = buildInviteLink(token);

    console.log('Invite Link:', inviteLink);

    await resend.emails.send({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to: [email],
      subject: 'You have been invited to a workspace',
      html: `
        <p>You have been invited to join a workspace.</p>
        <p><a href="${inviteLink}">Accept invitation</a></p>
        <p>If the link does not work, copy and paste this URL:</p>
        <p>${inviteLink}</p>
      `,
    });

    const payload = { message: 'Invitation sent' };
    if (process.env.NODE_ENV !== 'production') {
      payload.inviteLink = inviteLink;
    }
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
});

router.post('/accept', async (req, res, next) => {
  try {
    const { token, password, name } = req.body;
    if (!token || !password) {
      return res
        .status(400)
        .json({ message: 'token and password are required' });
    }

    const [invite] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);

    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    if (invite.acceptedAt) {
      return res.status(400).json({ message: 'Invite already accepted' });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'Invite expired' });
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, invite.email))
      .limit(1);

    let userId = existingUser?.id;

    if (existingUser?.password_hash) {
      return res.status(400).json({ message: 'Account already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const finalRole = invite.role === 'ADMIN' ? 'ADMIN' : 'USER';

    if (!existingUser) {
      userId = generateId('user');
      await db.insert(users).values({
        id: userId,
        name: name || invite.email.split('@')[0],
        email: invite.email,
        password_hash: passwordHash,
        role: finalRole,
      });
    } else {
      await db
        .update(users)
        .set({ password_hash: passwordHash, role: finalRole })
        .where(eq(users.id, existingUser.id));
    }

    const memberId = generateId('wm');
    await db.insert(workspaceMembers).values({
      id: memberId,
      workspaceId: invite.workspaceId,
      userId,
      role: invite.role,
      message: '',
    });

    if (invite.projectId) {
      const projectMemberId = generateId('pm');
      await db.insert(projectMembers).values({
        id: projectMemberId,
        projectId: invite.projectId,
        userId,
      });
    }

    await db
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.id, invite.id));

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const safeUser = stripSensitive(user);

    const jwt = (await import('jsonwebtoken')).default;
    const tokenValue = jwt.sign(
      { sub: safeUser.id, email: safeUser.email, role: safeUser.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    res.json({ token: tokenValue, user: safeUser });
  } catch (error) {
    next(error);
  }
});

export default router;
