-- CreateEnum
CREATE TYPE "Status" AS ENUM ('active', 'inactive', 'pending');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('Basic', 'Team', 'Enterprise');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "plan_name" "Plan" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
