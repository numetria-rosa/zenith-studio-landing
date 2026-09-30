CREATE TABLE "AieOrientation" (
    "userId" TEXT NOT NULL,
    "pathTop" TEXT[],
    "selfCheckScore" INTEGER,
    "selfCheckTotal" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AieOrientation_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "AieOrientation" ADD CONSTRAINT "AieOrientation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
