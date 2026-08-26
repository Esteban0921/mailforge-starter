-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('pending', 'subscribed', 'unsubscribed', 'bounced', 'complained');

-- CreateTable
CREATE TABLE "Audience" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Audience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "status" "SubscriberStatus" NOT NULL DEFAULT 'pending',
    "confirmToken" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "consentAt" TIMESTAMP(3),
    "consentSource" TEXT,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudienceSubscriber" (
    "audienceId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudienceSubscriber_pkey" PRIMARY KEY ("audienceId","subscriberId")
);

-- CreateTable
CREATE TABLE "Segment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "audienceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Audience_organizationId_idx" ON "Audience"("organizationId");

-- CreateIndex
CREATE INDEX "Subscriber_organizationId_status_idx" ON "Subscriber"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Subscriber_confirmToken_idx" ON "Subscriber"("confirmToken");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_organizationId_email_key" ON "Subscriber"("organizationId", "email");

-- CreateIndex
CREATE INDEX "AudienceSubscriber_subscriberId_idx" ON "AudienceSubscriber"("subscriberId");

-- CreateIndex
CREATE INDEX "Segment_organizationId_idx" ON "Segment"("organizationId");

-- CreateIndex
CREATE INDEX "Segment_audienceId_idx" ON "Segment"("audienceId");

-- AddForeignKey
ALTER TABLE "Audience" ADD CONSTRAINT "Audience_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudienceSubscriber" ADD CONSTRAINT "AudienceSubscriber_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "Audience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudienceSubscriber" ADD CONSTRAINT "AudienceSubscriber_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Segment" ADD CONSTRAINT "Segment_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "Audience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

