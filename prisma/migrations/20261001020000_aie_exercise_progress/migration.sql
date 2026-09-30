CREATE TABLE "AieExerciseProgress" (
    "userId" TEXT NOT NULL,
    "module" INTEGER NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "attempted" BOOLEAN NOT NULL DEFAULT false,
    "passed" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AieExerciseProgress_pkey" PRIMARY KEY ("userId","module")
);

ALTER TABLE "AieExerciseProgress" ADD CONSTRAINT "AieExerciseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
