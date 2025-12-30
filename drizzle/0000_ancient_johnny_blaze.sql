CREATE TABLE `todos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task` text NOT NULL,
	`is_completed` integer DEFAULT false,
	`created_at` integer
);
