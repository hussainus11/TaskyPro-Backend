-- CreateEnum
CREATE TYPE "MailFolder" AS ENUM ('INBOX', 'SENT', 'DRAFT', 'TRASH', 'ARCHIVE', 'SPAM');

-- CreateTable
CREATE TABLE "Mail" (
    "id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "toEmail" TEXT NOT NULL,
    "toName" TEXT,
    "cc" TEXT,
    "bcc" TEXT,
    "replyTo" TEXT,
    "folder" "MailFolder" NOT NULL DEFAULT 'INBOX',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attachments" JSONB,
    "headers" JSONB,
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "smtpSettingId" INTEGER,
    "threadId" TEXT,
    "inReplyTo" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Mail_userId_idx" ON "Mail"("userId");

-- CreateIndex
CREATE INDEX "Mail_companyId_idx" ON "Mail"("companyId");

-- CreateIndex
CREATE INDEX "Mail_branchId_idx" ON "Mail"("branchId");

-- CreateIndex
CREATE INDEX "Mail_folder_idx" ON "Mail"("folder");

-- CreateIndex
CREATE INDEX "Mail_isRead_idx" ON "Mail"("isRead");

-- CreateIndex
CREATE INDEX "Mail_isStarred_idx" ON "Mail"("isStarred");

-- CreateIndex
CREATE INDEX "Mail_sentAt_idx" ON "Mail"("sentAt");

-- CreateIndex
CREATE INDEX "Mail_receivedAt_idx" ON "Mail"("receivedAt");

-- CreateIndex
CREATE INDEX "Mail_threadId_idx" ON "Mail"("threadId");

-- CreateIndex
CREATE INDEX "Mail_userId_folder_idx" ON "Mail"("userId", "folder");

-- CreateIndex
CREATE INDEX "Mail_companyId_branchId_idx" ON "Mail"("companyId", "branchId");

-- AddForeignKey
ALTER TABLE "Mail" ADD CONSTRAINT "Mail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mail" ADD CONSTRAINT "Mail_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mail" ADD CONSTRAINT "Mail_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mail" ADD CONSTRAINT "Mail_smtpSettingId_fkey" FOREIGN KEY ("smtpSettingId") REFERENCES "SmtpSetting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mail" ADD CONSTRAINT "Mail_inReplyTo_fkey" FOREIGN KEY ("inReplyTo") REFERENCES "Mail"("id") ON DELETE SET NULL ON UPDATE CASCADE;

