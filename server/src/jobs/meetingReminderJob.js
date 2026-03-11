import cron from 'node-cron';
import { and, eq, inArray, lte } from 'drizzle-orm';
import { db } from '../db/index.js';
import { meetingReminders, meetings, workspaces } from '../db/schema.js';
import { isEmailConfigured } from '../lib/email.js';
import { sendMeetingReminderEmails } from '../lib/meetingNotifications.js';

const MAX_BATCH_SIZE = 50;
const STALE_PROCESSING_MINUTES = 10;

let meetingReminderTask = null;
let isProcessing = false;

const getCronExpression = () => {
  const configuredExpression = process.env.MEETING_REMINDER_CRON || '* * * * *';

  if (cron.validate(configuredExpression)) {
    return configuredExpression;
  }

  console.warn(
    `[meeting-reminders] Invalid cron expression "${configuredExpression}". Falling back to every minute.`
  );

  return '* * * * *';
};

const resetStaleProcessingReminders = async (now) => {
  const staleBefore = new Date(
    now.getTime() - STALE_PROCESSING_MINUTES * 60 * 1000
  );

  await db
    .update(meetingReminders)
    .set({
      status: 'PENDING',
      processingAt: null,
      updatedAt: now,
      error: 'Requeued after interrupted processing',
    })
    .where(
      and(
        eq(meetingReminders.status, 'PROCESSING'),
        lte(meetingReminders.processingAt, staleBefore)
      )
    );
};

const claimDueReminders = async (now) => {
  const dueReminders = await db
    .select({ id: meetingReminders.id })
    .from(meetingReminders)
    .where(
      and(
        eq(meetingReminders.status, 'PENDING'),
        lte(meetingReminders.scheduledFor, now)
      )
    )
    .limit(MAX_BATCH_SIZE);

  if (!dueReminders.length) {
    return [];
  }

  const dueIds = dueReminders.map((reminder) => reminder.id);

  return db
    .update(meetingReminders)
    .set({
      status: 'PROCESSING',
      processingAt: now,
      updatedAt: now,
      error: null,
    })
    .where(
      and(
        inArray(meetingReminders.id, dueIds),
        eq(meetingReminders.status, 'PENDING')
      )
    )
    .returning();
};

const updateReminderStatus = async (reminderId, status, changes = {}) => {
  await db
    .update(meetingReminders)
    .set({
      status,
      updatedAt: new Date(),
      ...changes,
    })
    .where(eq(meetingReminders.id, reminderId));
};

const processReminder = async (reminder, now) => {
  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, reminder.meetingId))
    .limit(1);

  if (!meeting) {
    await updateReminderStatus(reminder.id, 'CANCELED', {
      processingAt: null,
      error: 'Meeting no longer exists',
    });
    return;
  }

  const scheduledAt = new Date(meeting.scheduledAt);
  if (
    meeting.status !== 'SCHEDULED' ||
    Number.isNaN(scheduledAt.getTime()) ||
    scheduledAt <= now
  ) {
    await updateReminderStatus(reminder.id, 'CANCELED', {
      processingAt: null,
      error:
        meeting.status !== 'SCHEDULED'
          ? `Meeting status is ${meeting.status}`
          : 'Meeting start time has already passed',
    });
    return;
  }

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, meeting.workspaceId))
    .limit(1);

  try {
    await sendMeetingReminderEmails({
      workspaceName: workspace?.name || null,
      firstName: meeting.firstName,
      lastName: meeting.lastName,
      email: meeting.email,
      phone: meeting.phone,
      timezone: meeting.timezone,
      durationMinutes: meeting.durationMinutes,
      scheduledAt,
      minutesBefore: reminder.minutesBefore,
    });

    await updateReminderStatus(reminder.id, 'SENT', {
      processingAt: null,
      sentAt: new Date(),
      error: null,
    });
  } catch (error) {
    console.error(
      `[meeting-reminders] Failed to send reminder ${reminder.id}:`,
      error
    );

    await updateReminderStatus(reminder.id, 'FAILED', {
      processingAt: null,
      error: error?.message || 'Failed to send reminder email',
    });
  }
};

const runMeetingReminderCycle = async () => {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    const now = new Date();
    await resetStaleProcessingReminders(now);

    const reminders = await claimDueReminders(now);
    if (!reminders.length) {
      return;
    }

    for (const reminder of reminders) {
      await processReminder(reminder, now);
    }
  } catch (error) {
    console.error('[meeting-reminders] Worker cycle failed:', error);
  } finally {
    isProcessing = false;
  }
};

export const startMeetingReminderJob = () => {
  if (meetingReminderTask) {
    return meetingReminderTask;
  }

  if (!isEmailConfigured()) {
    console.warn(
      '[meeting-reminders] Email credentials are missing. Reminder cron job was not started.'
    );
    return null;
  }

  const cronExpression = getCronExpression();
  meetingReminderTask = cron.schedule(cronExpression, () => {
    void runMeetingReminderCycle();
  });

  console.log(
    `[meeting-reminders] Cron worker started with schedule "${cronExpression}"`
  );

  void runMeetingReminderCycle();

  return meetingReminderTask;
};
