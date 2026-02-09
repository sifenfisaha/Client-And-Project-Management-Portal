ALTER TABLE "clients" ADD COLUMN "portal_workspace_id" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "portal_project_id" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "portal_user_id" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "source_project_id" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "source_task_id" text;
