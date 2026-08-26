import { IsIn, IsOptional } from 'class-validator';

/** Mirrors Prisma's SubscriberStatus enum as a literal list, same as the
 * frontend mock — avoids importing @mailforge/database into a DTO. */
const SUBSCRIBER_STATUSES = [
  'pending',
  'subscribed',
  'unsubscribed',
  'bounced',
  'complained',
] as const;

export class ListSubscribersQueryDto {
  @IsOptional()
  @IsIn(SUBSCRIBER_STATUSES)
  status?: (typeof SUBSCRIBER_STATUSES)[number];
}
