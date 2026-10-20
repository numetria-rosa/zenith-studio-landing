-- Temporary hold set by the weekly cost cap or the hourly rate limit; lifts on its own.
ALTER TABLE "ServiceProject" ADD COLUMN "usageHoldUntil" TIMESTAMP(3);
