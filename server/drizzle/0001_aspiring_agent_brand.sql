CREATE TABLE "meeting_reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"reminder_type" text NOT NULL,
	"minutes_before" integer NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"processing_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meeting_reminders" ADD CONSTRAINT "meeting_reminders_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_reminders_meeting_type_uidx" ON "meeting_reminders" USING btree ("meeting_id","reminder_type");--> statement-breakpoint
CREATE INDEX "meeting_reminders_status_scheduled_idx" ON "meeting_reminders" USING btree ("status","scheduled_for");