import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const inquiries = sqliteTable('inquiries', {
  id:text('id').primaryKey(), requestKey:text('request_key').notNull(),
  name:text('name').notNull(), email:text('email').notNull(), company:text('company').notNull().default(''),
  interest:text('interest').notNull().default('General inquiry'), message:text('message').notNull(),
  status:text('status').notNull().default('new'), notes:text('notes').notNull().default(''),
  createdAt:text('created_at').notNull(), updatedAt:text('updated_at').notNull(),
}, table=>[uniqueIndex('inquiry_request_key_unique').on(table.requestKey),index('inquiry_status_created').on(table.status,table.createdAt)]);

export const bookings = sqliteTable('bookings', {
  id:text('id').primaryKey(),requestKey:text('request_key').notNull(),
  name:text('name').notNull(),email:text('email').notNull(),company:text('company').notNull().default(''),
  interest:text('interest').notNull().default('General inquiry'),message:text('message').notNull().default(''),
  timezone:text('timezone').notNull(),preferredDate:text('preferred_date').notNull(),preferredTime:text('preferred_time').notNull(),
  status:text('status').notNull().default('new'),confirmedAt:text('confirmed_at'),meetingUrl:text('meeting_url').notNull().default(''),notes:text('notes').notNull().default(''),
  createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
},table=>[uniqueIndex('booking_request_key_unique').on(table.requestKey),index('booking_status_created').on(table.status,table.createdAt)]);

export const caseStudies=sqliteTable('case_studies',{
  id:text('id').primaryKey(),requestKey:text('request_key'),title:text('title').notNull(),clientLabel:text('client_label').notNull().default(''),sector:text('sector').notNull().default(''),
  challenge:text('challenge').notNull().default(''),approach:text('approach').notNull().default(''),outcome:text('outcome').notNull().default(''),
  permissionConfirmed:integer('permission_confirmed').notNull().default(0),status:text('status').notNull().default('draft'),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
},table=>[uniqueIndex('case_request_key_unique').on(table.requestKey),index('case_status_created').on(table.status,table.createdAt)]);

export const siteSettings=sqliteTable('site_settings',{key:text('key').primaryKey(),value:text('value').notNull(),updatedAt:text('updated_at').notNull()});
export const ownerIdentity=sqliteTable('owner_identity',{id:text('id').primaryKey(),userId:text('user_id').notNull(),verifiedEmail:text('verified_email').notNull(),createdAt:text('created_at').notNull()});
export const submissionLimits=sqliteTable('submission_limits',{bucket:text('bucket').primaryKey(),hits:integer('hits').notNull(),windowStart:integer('window_start').notNull()});
