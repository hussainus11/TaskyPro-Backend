-- CreateTable
CREATE TABLE "UserSettings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "username" TEXT,
    "bio" TEXT,
    "profileUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "avatar" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "language" TEXT DEFAULT 'en',
    "billingPlan" TEXT,
    "nextPaymentDate" TIMESTAMP(3),
    "paymentMethods" JSONB,
    "theme" TEXT DEFAULT 'light',
    "font" TEXT DEFAULT 'system',
    "notificationType" TEXT DEFAULT 'all',
    "mobileNotifications" BOOLEAN NOT NULL DEFAULT false,
    "communicationEmails" BOOLEAN NOT NULL DEFAULT false,
    "socialEmails" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "securityEmails" BOOLEAN NOT NULL DEFAULT true,
    "sidebarItems" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "UserSettings_userId_idx" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
