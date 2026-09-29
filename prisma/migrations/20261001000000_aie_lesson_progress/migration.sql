CREATE TABLE "AieLessonProgress" (
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AieLessonProgress_pkey" PRIMARY KEY ("userId","lessonId")
);

ALTER TABLE "AieLessonProgress" ADD CONSTRAINT "AieLessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
