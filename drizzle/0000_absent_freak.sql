CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`request_key` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`interest` text DEFAULT 'General inquiry' NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`timezone` text NOT NULL,
	`preferred_date` text NOT NULL,
	`preferred_time` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`confirmed_at` text,
	`meeting_url` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `booking_request_key_unique` ON `bookings` (`request_key`);--> statement-breakpoint
CREATE INDEX `booking_status_created` ON `bookings` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `case_studies` (
	`id` text PRIMARY KEY NOT NULL,
	`request_key` text,
	`title` text NOT NULL,
	`client_label` text DEFAULT '' NOT NULL,
	`sector` text DEFAULT '' NOT NULL,
	`challenge` text DEFAULT '' NOT NULL,
	`approach` text DEFAULT '' NOT NULL,
	`outcome` text DEFAULT '' NOT NULL,
	`permission_confirmed` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `case_request_key_unique` ON `case_studies` (`request_key`);--> statement-breakpoint
CREATE INDEX `case_status_created` ON `case_studies` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`request_key` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`interest` text DEFAULT 'General inquiry' NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inquiry_request_key_unique` ON `inquiries` (`request_key`);--> statement-breakpoint
CREATE INDEX `inquiry_status_created` ON `inquiries` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `owner_identity` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`verified_email` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `submission_limits` (
	`bucket` text PRIMARY KEY NOT NULL,
	`hits` integer NOT NULL,
	`window_start` integer NOT NULL
);
