CREATE TABLE "AieCapstone" (
    "userId" TEXT NOT NULL,
    "design" JSONB NOT NULL DEFAULT '{}',
    "designScore" INTEGER,
    "implCode" TEXT NOT NULL DEFAULT '',
    "implScore" INTEGER,
    "debugQ1" INTEGER,
    "debugAnswer" TEXT NOT NULL DEFAULT '',
    "debugAnswerOk" BOOLEAN,
    "debugScore" INTEGER,
    "review" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AieCapstone_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "AieCapstone" ADD CONSTRAINT "AieCapstone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
