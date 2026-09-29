CREATE TABLE "AieProjectProgress" (
    "userId" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "rubric" JSONB NOT NULL DEFAULT '{}',
    "githubUrl" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "technologies" TEXT NOT NULL DEFAULT '',
    "testsPassed" TEXT NOT NULL DEFAULT '',
    "score" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AieProjectProgress_pkey" PRIMARY KEY ("userId","projectId")
);

ALTER TABLE "AieProjectProgress" ADD CONSTRAINT "AieProjectProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
