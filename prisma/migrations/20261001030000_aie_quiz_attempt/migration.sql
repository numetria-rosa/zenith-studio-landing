CREATE TABLE "AieQuizAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AieQuizAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AieQuizAttempt_userId_module_idx" ON "AieQuizAttempt"("userId", "module");

ALTER TABLE "AieQuizAttempt" ADD CONSTRAINT "AieQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
