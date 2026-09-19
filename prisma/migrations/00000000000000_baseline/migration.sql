-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DashboardVisibility" AS ENUM ('PRIVATE', 'COMPANY', 'ROLES', 'USERS');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('pending', 'connected', 'blocked');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('active', 'inactive', 'pending');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('Free', 'Basic', 'Pro', 'Enterprise');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('Active', 'Inactive', 'Cancelled', 'Expired', 'Pending');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('Monthly', 'Yearly');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'manager', 'employee');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('text', 'checklist', 'image');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('text', 'email', 'phone', 'textarea', 'select', 'number', 'url', 'image');

-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('DIRECT', 'GROUP');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'SOUND');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- CreateEnum
CREATE TYPE "TodoStatus" AS ENUM ('pending', 'inProgress', 'completed');

-- CreateEnum
CREATE TYPE "TodoPriority" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "LeadStageType" AS ENUM ('initial', 'additional', 'success', 'failed');

-- CreateEnum
CREATE TYPE "DocumentStageType" AS ENUM ('initial', 'additional', 'success', 'failed');

-- CreateEnum
CREATE TYPE "InvoiceStageType" AS ENUM ('initial', 'additional', 'success', 'failed');

-- CreateEnum
CREATE TYPE "EstimateStageType" AS ENUM ('initial', 'additional', 'success', 'failed');

-- CreateEnum
CREATE TYPE "Module" AS ENUM ('LEADS', 'CONTACTS', 'DEALS', 'COMPANIES', 'TASKS', 'DOCUMENTS', 'INVOICES', 'ESTIMATES', 'REPORTS', 'SETTINGS', 'USERS', 'PRODUCTS', 'ORDERS', 'DASHBOARD', 'ANALYTICS', 'EMAIL', 'INTEGRATIONS', 'AUTOMATION');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('MENU', 'PAGE', 'SECTION', 'FIELD');

-- CreateEnum
CREATE TYPE "ProcessTrigger" AS ENUM ('MANUAL', 'SCHEDULED', 'EVENT_BASED', 'WEBHOOK', 'API_CALL');

-- CreateEnum
CREATE TYPE "ProcessStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StepType" AS ENUM ('CONDITION', 'ACTION', 'DELAY', 'NOTIFICATION', 'ASSIGNMENT', 'UPDATE_FIELD', 'CREATE_RECORD', 'SEND_EMAIL', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "EmailTemplateCategory" AS ENUM ('WELCOME', 'NOTIFICATION', 'FOLLOW_UP', 'REMINDER', 'INVOICE', 'QUOTE', 'LEAD_NURTURING', 'DEAL_CLOSED', 'TASK_ASSIGNED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MailFolder" AS ENUM ('INBOX', 'SENT', 'DRAFT', 'TRASH', 'ARCHIVE', 'SPAM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LEAD_CREATED', 'LEAD_UPDATED', 'LEAD_ASSIGNED', 'LEAD_STAGE_CHANGED', 'DEAL_CREATED', 'DEAL_UPDATED', 'DEAL_CLOSED', 'DEAL_LOST', 'TASK_CREATED', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'TASK_OVERDUE', 'CONTACT_CREATED', 'CONTACT_UPDATED', 'INVOICE_CREATED', 'INVOICE_SENT', 'INVOICE_PAID', 'INVOICE_OVERDUE', 'QUOTE_CREATED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'QUOTE_REJECTED', 'USER_MENTIONED', 'COMMENT_ADDED', 'FILE_UPLOADED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationFrequency" AS ENUM ('IMMEDIATE', 'HOURLY_DIGEST', 'DAILY_DIGEST', 'WEEKLY_DIGEST', 'NEVER');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'IN_APP', 'PUSH', 'ALL');

-- CreateEnum
CREATE TYPE "FormEntityType" AS ENUM ('LEAD', 'DEAL', 'CONTACT', 'COMPANY', 'USER', 'TASK', 'INVOICE', 'QUOTE', 'PRODUCT', 'CUSTOMER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FeedNotificationType" AS ENUM ('POST_CREATED', 'POST_LIKED', 'POST_COMMENTED', 'CALENDAR_EVENT_STARTING');

-- CreateEnum
CREATE TYPE "CollabStatus" AS ENUM ('ACTIVE', 'PENDING', 'ARCHIVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CollabMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'GUEST');

-- CreateEnum
CREATE TYPE "CollabInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WorkGroupStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkGroupMemberRole" AS ENUM ('LEADER', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DOCUMENT', 'SPREADSHEET', 'PRESENTATION', 'BOARD');

-- CreateEnum
CREATE TYPE "EventColor" AS ENUM ('sky', 'amber', 'violet', 'rose', 'emerald', 'orange');

-- CreateEnum
CREATE TYPE "FitnessActivityType" AS ENUM ('RUNNING', 'CYCLING', 'WALKING', 'SWIMMING', 'STRENGTH_TRAINING', 'YOGA', 'PILATES', 'CARDIO', 'CROSSFIT', 'OTHER');

-- CreateEnum
CREATE TYPE "FitnessActivityStatus" AS ENUM ('PLANNED', 'COMPLETED', 'CANCELLED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('SALE', 'RETURN', 'REFUND');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SINGLE', 'VARIANT', 'COMPOSITE');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('DOCUMENT', 'IMAGE', 'VIDEO', 'AUDIO', 'ARCHIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReminderPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('DEFECTIVE', 'DAMAGED', 'WRONG_ITEM', 'NOT_AS_DESCRIBED', 'CUSTOMER_CHANGE_MIND', 'LATE_DELIVERY', 'DUPLICATE_ORDER', 'OTHER');

-- CreateEnum
CREATE TYPE "RefundMethod" AS ENUM ('ORIGINAL_PAYMENT', 'CASH', 'CARD', 'BANK_TRANSFER', 'STORE_CREDIT', 'EXCHANGE');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('available', 'occupied', 'reserved');

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "slug" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'Free',
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'Active',
    "subscriptionStartDate" TIMESTAMP(3),
    "subscriptionEndDate" TIMESTAMP(3),
    "trialEndDate" TIMESTAMP(3),
    "billingCycle" "BillingCycle" DEFAULT 'Monthly',
    "customFieldsSectionTitle" TEXT DEFAULT 'Custom Fields',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "companyId" INTEGER NOT NULL,
    "customFieldsSectionTitle" TEXT DEFAULT 'Custom Fields',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "googleId" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "country" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "image" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "plan_name" "Plan" NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "department" TEXT,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "roleId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConnection" (
    "id" SERIAL NOT NULL,
    "user1Id" INTEGER NOT NULL,
    "user2Id" INTEGER NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "type" "NoteType" NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteLabel" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteChecklistItem" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "noteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSection" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "position" TEXT DEFAULT 'center',
    "columns" INTEGER DEFAULT 12,
    "companyId" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormField" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "value" TEXT,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "sectionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSectionPermission" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormSectionPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormFieldPermission" (
    "id" SERIAL NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormFieldPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" INTEGER,
    "userId" INTEGER,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" INTEGER,
    "userId" INTEGER,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "userId" INTEGER,
    "companyId" INTEGER,
    "isSent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" SERIAL NOT NULL,
    "type" "ChatType" NOT NULL DEFAULT 'DIRECT',
    "name" TEXT,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "lastMessageId" INTEGER,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatParticipant" (
    "id" SERIAL NOT NULL,
    "chatId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" SERIAL NOT NULL,
    "chatId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "data" JSONB,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "replyToId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatAccess" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "targetUserId" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TodoStatus" NOT NULL DEFAULT 'pending',
    "priority" "TodoPriority" NOT NULL DEFAULT 'medium',
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "reminderDate" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,
    "userId" INTEGER,
    "assignedTo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TodoComment" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "todoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TodoComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TodoFile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "todoId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TodoFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TodoSubTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "todoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TodoSubTask_pkey" PRIMARY KEY ("id")
);

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
    "tablePreferences" JSONB,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadStage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "LeadStageType" NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentStage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "DocumentStageType" NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceStage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "InvoiceStageType" NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimateStage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "EstimateStageType" NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstimateStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Salutation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Salutation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallStatus" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Industry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Currency" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "zipCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tax" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitOfMeasurement" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitOfMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductProperty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealPipeline" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealPipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "pipelineId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineConnection" (
    "id" SERIAL NOT NULL,
    "fromStageId" INTEGER NOT NULL,
    "toStageId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessControl" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "conditions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Security" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT,
    "config" JSONB,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Security_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomField" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "includeInReports" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticalReport" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "customFieldIds" JSONB NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticalReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoNumbering" (
    "id" SERIAL NOT NULL,
    "entity" TEXT NOT NULL,
    "prefix" TEXT,
    "suffix" TEXT,
    "format" TEXT NOT NULL,
    "startingNumber" INTEGER NOT NULL DEFAULT 1,
    "currentNumber" INTEGER NOT NULL DEFAULT 0,
    "numberLength" INTEGER,
    "resetPeriod" TEXT,
    "lastResetDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoNumbering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionSetting" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "module" "Module",
    "resourceType" "ResourceType" DEFAULT 'MENU',
    "resourcePath" TEXT,
    "resourceName" TEXT,
    "parentId" INTEGER,
    "canRead" BOOLEAN NOT NULL DEFAULT false,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canManage" BOOLEAN NOT NULL DEFAULT false,
    "canExport" BOOLEAN NOT NULL DEFAULT false,
    "canImport" BOOLEAN NOT NULL DEFAULT false,
    "fieldPermissions" JSONB,
    "sectionPermissions" JSONB,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessProcess" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" "ProcessTrigger" NOT NULL DEFAULT 'MANUAL',
    "status" "ProcessStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "steps" JSONB,
    "conditions" JSONB,
    "settings" JSONB,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "EmailTemplateCategory" NOT NULL DEFAULT 'CUSTOM',
    "description" TEXT,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmtpSetting" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmtpSetting_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "EmailNotification" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "description" TEXT,
    "trigger" JSONB,
    "recipients" JSONB,
    "templateId" INTEGER,
    "frequency" "NotificationFrequency" NOT NULL DEFAULT 'IMMEDIATE',
    "channels" JSONB,
    "conditions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSignature" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "plainText" TEXT,
    "userId" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" "FormEntityType" NOT NULL,
    "customEntityName" TEXT,
    "formFields" JSONB NOT NULL,
    "workflowId" INTEGER,
    "path" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "yearlyPrice" DOUBLE PRECISION,
    "industry" TEXT,
    "features" JSONB NOT NULL,
    "enabledMenuItems" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomEntityPage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "templateId" INTEGER NOT NULL,
    "customEntityName" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomEntityPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityData" (
    "id" SERIAL NOT NULL,
    "entityType" "FormEntityType" NOT NULL,
    "customEntityName" TEXT,
    "templateId" INTEGER,
    "data" JSONB NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedPost" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "image" TEXT,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedLike" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedComment" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "postId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "type" "FeedNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "actorId" INTEGER,
    "postId" INTEGER,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collab" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CollabStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollabMember" (
    "id" SERIAL NOT NULL,
    "collabId" INTEGER NOT NULL,
    "userId" INTEGER,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "CollabMemberRole" NOT NULL DEFAULT 'MEMBER',
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollabMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollabInvitation" (
    "id" SERIAL NOT NULL,
    "collabId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "CollabMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "CollabInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollabInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkGroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkGroupMember" (
    "id" SERIAL NOT NULL,
    "workGroupId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "WorkGroupMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "content" TEXT,
    "createdById" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "color" "EventColor" DEFAULT 'sky',
    "location" TEXT,
    "userId" INTEGER,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FitnessActivity" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "FitnessActivityType" NOT NULL,
    "status" "FitnessActivityStatus" NOT NULL DEFAULT 'PLANNED',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "distance" DOUBLE PRECISION,
    "calories" INTEGER,
    "heartRate" INTEGER,
    "notes" TEXT,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FitnessActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionEntry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "calories" INTEGER NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "fats" DOUBLE PRECISION NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SleepRecord" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "sleepHours" DOUBLE PRECISION NOT NULL,
    "sleepMinutes" INTEGER NOT NULL,
    "quality" INTEGER NOT NULL,
    "bedTime" TIMESTAMP(3),
    "wakeTime" TIMESTAMP(3),
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SleepRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSubCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "discountedPrice" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,
    "chargeTax" BOOLEAN NOT NULL DEFAULT false,
    "taxPercentage" DOUBLE PRECISION,
    "discountType" TEXT,
    "discountValue" DOUBLE PRECISION,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "sub_category" TEXT,
    "brand" TEXT,
    "productType" "ProductType" NOT NULL DEFAULT 'SINGLE',
    "variants" JSONB,
    "variantGroups" JSONB,
    "compositeItems" JSONB,
    "customFields" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "type" "OrderType" NOT NULL DEFAULT 'SALE',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION DEFAULT 0,
    "discount" DOUBLE PRECISION DEFAULT 0,
    "shippingCost" DOUBLE PRECISION DEFAULT 0,
    "currency" TEXT DEFAULT 'USD',
    "paymentMethod" TEXT,
    "paymentStatus" TEXT,
    "shippingAddress" TEXT,
    "notes" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shippedDate" TIMESTAMP(3),
    "deliveredDate" TIMESTAMP(3),
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "returnedQuantity" INTEGER NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "parentFolderId" INTEGER,
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "originalName" TEXT,
    "type" "FileType" NOT NULL DEFAULT 'OTHER',
    "mimeType" TEXT,
    "size" INTEGER NOT NULL,
    "url" TEXT,
    "thumbnailUrl" TEXT,
    "deviceType" TEXT,
    "folderId" INTEGER,
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "spent" DOUBLE PRECISION DEFAULT 0,
    "clientName" TEXT,
    "clientAvatar" TEXT,
    "progressColor" TEXT,
    "badgeColor" TEXT,
    "managerId" INTEGER,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "icon" TEXT,
    "group" TEXT,
    "parentId" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isComing" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "isDataBadge" TEXT,
    "newTab" BOOLEAN NOT NULL DEFAULT false,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" SERIAL NOT NULL,
    "note" TEXT NOT NULL,
    "priority" "ReminderPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "dueDate" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPayment" (
    "id" SERIAL NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "orderId" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "notes" TEXT,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "ipAddress" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPayment" (
    "id" SERIAL NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "notes" TEXT,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageQuota" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "totalStorage" BIGINT NOT NULL DEFAULT 10737418240,
    "usedStorage" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExceptionLog" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "source" TEXT NOT NULL,
    "userId" INTEGER,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "requestUrl" TEXT,
    "requestMethod" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" INTEGER,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExceptionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderReturn" (
    "id" SERIAL NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'PENDING',
    "returnReason" "ReturnReason" NOT NULL,
    "returnReasonNote" TEXT,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedDate" TIMESTAMP(3),
    "refundAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refundMethod" "RefundMethod",
    "refundStatus" "PaymentStatus" DEFAULT 'PENDING',
    "refundReference" TEXT,
    "notes" TEXT,
    "processedById" INTEGER,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderReturnItem" (
    "id" SERIAL NOT NULL,
    "returnId" INTEGER NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "refundAmount" DOUBLE PRECISION NOT NULL,
    "reason" "ReturnReason",
    "reasonNote" TEXT,
    "condition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'available',
    "categoryId" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT NOT NULL,
    "columns" JSONB NOT NULL,
    "filters" JSONB,
    "sorting" JSONB,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdfReport" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT,
    "layout" JSONB NOT NULL,
    "pageSettings" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PdfReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealDashboard" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filter" JSONB NOT NULL,
    "layout" JSONB NOT NULL,
    "widgets" JSONB NOT NULL,
    "visibility" "DashboardVisibility" NOT NULL DEFAULT 'PRIVATE',
    "companyId" INTEGER NOT NULL,
    "branchId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealDashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealDashboardRoleShare" (
    "id" SERIAL NOT NULL,
    "dashboardId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealDashboardRoleShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealDashboardUserShare" (
    "id" SERIAL NOT NULL,
    "dashboardId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealDashboardUserShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealDashboardUserPref" (
    "id" SERIAL NOT NULL,
    "dashboardId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealDashboardUserPref_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_NoteToNoteLabel" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_NoteToNoteLabel_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_email_key" ON "Company"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "UserConnection_user1Id_idx" ON "UserConnection"("user1Id");

-- CreateIndex
CREATE INDEX "UserConnection_user2Id_idx" ON "UserConnection"("user2Id");

-- CreateIndex
CREATE INDEX "UserConnection_status_idx" ON "UserConnection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserConnection_user1Id_user2Id_key" ON "UserConnection"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "FormSection_companyId_idx" ON "FormSection"("companyId");

-- CreateIndex
CREATE INDEX "FormField_sectionId_idx" ON "FormField"("sectionId");

-- CreateIndex
CREATE INDEX "FormSectionPermission_sectionId_idx" ON "FormSectionPermission"("sectionId");

-- CreateIndex
CREATE INDEX "FormSectionPermission_userId_idx" ON "FormSectionPermission"("userId");

-- CreateIndex
CREATE INDEX "FormSectionPermission_companyId_idx" ON "FormSectionPermission"("companyId");

-- CreateIndex
CREATE INDEX "FormSectionPermission_branchId_idx" ON "FormSectionPermission"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "FormSectionPermission_sectionId_userId_companyId_branchId_key" ON "FormSectionPermission"("sectionId", "userId", "companyId", "branchId");

-- CreateIndex
CREATE INDEX "FormFieldPermission_fieldId_idx" ON "FormFieldPermission"("fieldId");

-- CreateIndex
CREATE INDEX "FormFieldPermission_userId_idx" ON "FormFieldPermission"("userId");

-- CreateIndex
CREATE INDEX "FormFieldPermission_companyId_idx" ON "FormFieldPermission"("companyId");

-- CreateIndex
CREATE INDEX "FormFieldPermission_branchId_idx" ON "FormFieldPermission"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "FormFieldPermission_fieldId_userId_companyId_branchId_key" ON "FormFieldPermission"("fieldId", "userId", "companyId", "branchId");

-- CreateIndex
CREATE INDEX "Activity_companyId_idx" ON "Activity"("companyId");

-- CreateIndex
CREATE INDEX "Activity_branchId_idx" ON "Activity"("branchId");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "Activity_entityType_entityId_idx" ON "Activity"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Activity_entityType_entityId_companyId_idx" ON "Activity"("entityType", "entityId", "companyId");

-- CreateIndex
CREATE INDEX "Comment_companyId_idx" ON "Comment"("companyId");

-- CreateIndex
CREATE INDEX "Comment_branchId_idx" ON "Comment"("branchId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_entityType_entityId_idx" ON "Comment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Comment_entityType_entityId_companyId_idx" ON "Comment"("entityType", "entityId", "companyId");

-- CreateIndex
CREATE INDEX "Message_companyId_idx" ON "Message"("companyId");

-- CreateIndex
CREATE INDEX "Message_userId_idx" ON "Message"("userId");

-- CreateIndex
CREATE INDEX "Chat_companyId_idx" ON "Chat"("companyId");

-- CreateIndex
CREATE INDEX "Chat_branchId_idx" ON "Chat"("branchId");

-- CreateIndex
CREATE INDEX "Chat_type_idx" ON "Chat"("type");

-- CreateIndex
CREATE INDEX "Chat_isArchived_idx" ON "Chat"("isArchived");

-- CreateIndex
CREATE INDEX "ChatParticipant_chatId_idx" ON "ChatParticipant"("chatId");

-- CreateIndex
CREATE INDEX "ChatParticipant_userId_idx" ON "ChatParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_chatId_userId_key" ON "ChatParticipant"("chatId", "userId");

-- CreateIndex
CREATE INDEX "ChatMessage_chatId_idx" ON "ChatMessage"("chatId");

-- CreateIndex
CREATE INDEX "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");

-- CreateIndex
CREATE INDEX "ChatMessage_status_idx" ON "ChatMessage"("status");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "ChatAccess_userId_idx" ON "ChatAccess"("userId");

-- CreateIndex
CREATE INDEX "ChatAccess_targetUserId_idx" ON "ChatAccess"("targetUserId");

-- CreateIndex
CREATE INDEX "ChatAccess_companyId_idx" ON "ChatAccess"("companyId");

-- CreateIndex
CREATE INDEX "ChatAccess_branchId_idx" ON "ChatAccess"("branchId");

-- CreateIndex
CREATE INDEX "ChatAccess_companyId_branchId_idx" ON "ChatAccess"("companyId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatAccess_userId_targetUserId_companyId_branchId_key" ON "ChatAccess"("userId", "targetUserId", "companyId", "branchId");

-- CreateIndex
CREATE INDEX "Todo_userId_idx" ON "Todo"("userId");

-- CreateIndex
CREATE INDEX "Todo_status_idx" ON "Todo"("status");

-- CreateIndex
CREATE INDEX "TodoComment_todoId_idx" ON "TodoComment"("todoId");

-- CreateIndex
CREATE INDEX "TodoFile_todoId_idx" ON "TodoFile"("todoId");

-- CreateIndex
CREATE INDEX "TodoSubTask_todoId_idx" ON "TodoSubTask"("todoId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "UserSettings_userId_idx" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "LeadStage_companyId_idx" ON "LeadStage"("companyId");

-- CreateIndex
CREATE INDEX "LeadStage_branchId_idx" ON "LeadStage"("branchId");

-- CreateIndex
CREATE INDEX "LeadStage_type_idx" ON "LeadStage"("type");

-- CreateIndex
CREATE INDEX "LeadStage_companyId_branchId_idx" ON "LeadStage"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "DocumentStage_companyId_idx" ON "DocumentStage"("companyId");

-- CreateIndex
CREATE INDEX "DocumentStage_branchId_idx" ON "DocumentStage"("branchId");

-- CreateIndex
CREATE INDEX "DocumentStage_type_idx" ON "DocumentStage"("type");

-- CreateIndex
CREATE INDEX "DocumentStage_companyId_branchId_idx" ON "DocumentStage"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "InvoiceStage_companyId_idx" ON "InvoiceStage"("companyId");

-- CreateIndex
CREATE INDEX "InvoiceStage_branchId_idx" ON "InvoiceStage"("branchId");

-- CreateIndex
CREATE INDEX "InvoiceStage_type_idx" ON "InvoiceStage"("type");

-- CreateIndex
CREATE INDEX "InvoiceStage_companyId_branchId_idx" ON "InvoiceStage"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "EstimateStage_companyId_idx" ON "EstimateStage"("companyId");

-- CreateIndex
CREATE INDEX "EstimateStage_branchId_idx" ON "EstimateStage"("branchId");

-- CreateIndex
CREATE INDEX "EstimateStage_type_idx" ON "EstimateStage"("type");

-- CreateIndex
CREATE INDEX "EstimateStage_companyId_branchId_idx" ON "EstimateStage"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Source_companyId_idx" ON "Source"("companyId");

-- CreateIndex
CREATE INDEX "Source_branchId_idx" ON "Source"("branchId");

-- CreateIndex
CREATE INDEX "Source_companyId_branchId_idx" ON "Source"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "ContactType_companyId_idx" ON "ContactType"("companyId");

-- CreateIndex
CREATE INDEX "ContactType_branchId_idx" ON "ContactType"("branchId");

-- CreateIndex
CREATE INDEX "ContactType_companyId_branchId_idx" ON "ContactType"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Salutation_companyId_idx" ON "Salutation"("companyId");

-- CreateIndex
CREATE INDEX "Salutation_branchId_idx" ON "Salutation"("branchId");

-- CreateIndex
CREATE INDEX "Salutation_companyId_branchId_idx" ON "Salutation"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "CallStatus_companyId_idx" ON "CallStatus"("companyId");

-- CreateIndex
CREATE INDEX "CallStatus_branchId_idx" ON "CallStatus"("branchId");

-- CreateIndex
CREATE INDEX "CallStatus_companyId_branchId_idx" ON "CallStatus"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "CompanyType_companyId_idx" ON "CompanyType"("companyId");

-- CreateIndex
CREATE INDEX "CompanyType_branchId_idx" ON "CompanyType"("branchId");

-- CreateIndex
CREATE INDEX "CompanyType_companyId_branchId_idx" ON "CompanyType"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Employee_companyId_idx" ON "Employee"("companyId");

-- CreateIndex
CREATE INDEX "Employee_branchId_idx" ON "Employee"("branchId");

-- CreateIndex
CREATE INDEX "Employee_companyId_branchId_idx" ON "Employee"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Industry_companyId_idx" ON "Industry"("companyId");

-- CreateIndex
CREATE INDEX "Industry_branchId_idx" ON "Industry"("branchId");

-- CreateIndex
CREATE INDEX "Industry_companyId_branchId_idx" ON "Industry"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "DealType_companyId_idx" ON "DealType"("companyId");

-- CreateIndex
CREATE INDEX "DealType_branchId_idx" ON "DealType"("branchId");

-- CreateIndex
CREATE INDEX "DealType_companyId_branchId_idx" ON "DealType"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Currency_companyId_idx" ON "Currency"("companyId");

-- CreateIndex
CREATE INDEX "Currency_branchId_idx" ON "Currency"("branchId");

-- CreateIndex
CREATE INDEX "Currency_companyId_branchId_idx" ON "Currency"("companyId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_code_companyId_branchId_key" ON "Currency"("code", "companyId", "branchId");

-- CreateIndex
CREATE INDEX "Location_companyId_idx" ON "Location"("companyId");

-- CreateIndex
CREATE INDEX "Location_branchId_idx" ON "Location"("branchId");

-- CreateIndex
CREATE INDEX "Location_companyId_branchId_idx" ON "Location"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Tax_companyId_idx" ON "Tax"("companyId");

-- CreateIndex
CREATE INDEX "Tax_branchId_idx" ON "Tax"("branchId");

-- CreateIndex
CREATE INDEX "Tax_companyId_branchId_idx" ON "Tax"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "UnitOfMeasurement_companyId_idx" ON "UnitOfMeasurement"("companyId");

-- CreateIndex
CREATE INDEX "UnitOfMeasurement_branchId_idx" ON "UnitOfMeasurement"("branchId");

-- CreateIndex
CREATE INDEX "UnitOfMeasurement_companyId_branchId_idx" ON "UnitOfMeasurement"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "ProductProperty_companyId_idx" ON "ProductProperty"("companyId");

-- CreateIndex
CREATE INDEX "ProductProperty_branchId_idx" ON "ProductProperty"("branchId");

-- CreateIndex
CREATE INDEX "ProductProperty_companyId_branchId_idx" ON "ProductProperty"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "DealPipeline_companyId_idx" ON "DealPipeline"("companyId");

-- CreateIndex
CREATE INDEX "DealPipeline_branchId_idx" ON "DealPipeline"("branchId");

-- CreateIndex
CREATE INDEX "DealPipeline_companyId_branchId_idx" ON "DealPipeline"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "DealPipeline_companyId_branchId_order_idx" ON "DealPipeline"("companyId", "branchId", "order");

-- CreateIndex
CREATE INDEX "PipelineStage_pipelineId_idx" ON "PipelineStage"("pipelineId");

-- CreateIndex
CREATE INDEX "PipelineStage_pipelineId_order_idx" ON "PipelineStage"("pipelineId", "order");

-- CreateIndex
CREATE INDEX "PipelineConnection_fromStageId_idx" ON "PipelineConnection"("fromStageId");

-- CreateIndex
CREATE INDEX "PipelineConnection_toStageId_idx" ON "PipelineConnection"("toStageId");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineConnection_fromStageId_toStageId_key" ON "PipelineConnection"("fromStageId", "toStageId");

-- CreateIndex
CREATE INDEX "Role_companyId_idx" ON "Role"("companyId");

-- CreateIndex
CREATE INDEX "Role_branchId_idx" ON "Role"("branchId");

-- CreateIndex
CREATE INDEX "Role_companyId_branchId_idx" ON "Role"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "AccessControl_companyId_idx" ON "AccessControl"("companyId");

-- CreateIndex
CREATE INDEX "AccessControl_branchId_idx" ON "AccessControl"("branchId");

-- CreateIndex
CREATE INDEX "AccessControl_resource_idx" ON "AccessControl"("resource");

-- CreateIndex
CREATE INDEX "AccessControl_companyId_branchId_idx" ON "AccessControl"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Security_companyId_idx" ON "Security"("companyId");

-- CreateIndex
CREATE INDEX "Security_branchId_idx" ON "Security"("branchId");

-- CreateIndex
CREATE INDEX "Security_type_idx" ON "Security"("type");

-- CreateIndex
CREATE INDEX "Security_companyId_branchId_idx" ON "Security"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "CustomField_companyId_idx" ON "CustomField"("companyId");

-- CreateIndex
CREATE INDEX "CustomField_branchId_idx" ON "CustomField"("branchId");

-- CreateIndex
CREATE INDEX "CustomField_entity_idx" ON "CustomField"("entity");

-- CreateIndex
CREATE INDEX "CustomField_companyId_branchId_idx" ON "CustomField"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "AnalyticalReport_companyId_idx" ON "AnalyticalReport"("companyId");

-- CreateIndex
CREATE INDEX "AnalyticalReport_branchId_idx" ON "AnalyticalReport"("branchId");

-- CreateIndex
CREATE INDEX "AnalyticalReport_companyId_branchId_idx" ON "AnalyticalReport"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "AutoNumbering_companyId_idx" ON "AutoNumbering"("companyId");

-- CreateIndex
CREATE INDEX "AutoNumbering_branchId_idx" ON "AutoNumbering"("branchId");

-- CreateIndex
CREATE INDEX "AutoNumbering_entity_idx" ON "AutoNumbering"("entity");

-- CreateIndex
CREATE INDEX "AutoNumbering_companyId_branchId_idx" ON "AutoNumbering"("companyId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "AutoNumbering_entity_companyId_branchId_key" ON "AutoNumbering"("entity", "companyId", "branchId");

-- CreateIndex
CREATE INDEX "PermissionSetting_roleId_idx" ON "PermissionSetting"("roleId");

-- CreateIndex
CREATE INDEX "PermissionSetting_module_idx" ON "PermissionSetting"("module");

-- CreateIndex
CREATE INDEX "PermissionSetting_resourceType_idx" ON "PermissionSetting"("resourceType");

-- CreateIndex
CREATE INDEX "PermissionSetting_resourcePath_idx" ON "PermissionSetting"("resourcePath");

-- CreateIndex
CREATE INDEX "PermissionSetting_parentId_idx" ON "PermissionSetting"("parentId");

-- CreateIndex
CREATE INDEX "PermissionSetting_companyId_branchId_idx" ON "PermissionSetting"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "PermissionSetting_companyId_idx" ON "PermissionSetting"("companyId");

-- CreateIndex
CREATE INDEX "PermissionSetting_branchId_idx" ON "PermissionSetting"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionSetting_roleId_module_companyId_branchId_key" ON "PermissionSetting"("roleId", "module", "companyId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionSetting_roleId_resourcePath_companyId_branchId_key" ON "PermissionSetting"("roleId", "resourcePath", "companyId", "branchId");

-- CreateIndex
CREATE INDEX "BusinessProcess_companyId_idx" ON "BusinessProcess"("companyId");

-- CreateIndex
CREATE INDEX "BusinessProcess_branchId_idx" ON "BusinessProcess"("branchId");

-- CreateIndex
CREATE INDEX "BusinessProcess_status_idx" ON "BusinessProcess"("status");

-- CreateIndex
CREATE INDEX "BusinessProcess_trigger_idx" ON "BusinessProcess"("trigger");

-- CreateIndex
CREATE INDEX "BusinessProcess_companyId_branchId_idx" ON "BusinessProcess"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "EmailTemplate_companyId_idx" ON "EmailTemplate"("companyId");

-- CreateIndex
CREATE INDEX "EmailTemplate_branchId_idx" ON "EmailTemplate"("branchId");

-- CreateIndex
CREATE INDEX "EmailTemplate_category_idx" ON "EmailTemplate"("category");

-- CreateIndex
CREATE INDEX "EmailTemplate_isActive_idx" ON "EmailTemplate"("isActive");

-- CreateIndex
CREATE INDEX "EmailTemplate_companyId_branchId_idx" ON "EmailTemplate"("companyId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_name_companyId_branchId_key" ON "EmailTemplate"("name", "companyId", "branchId");

-- CreateIndex
CREATE INDEX "SmtpSetting_companyId_idx" ON "SmtpSetting"("companyId");

-- CreateIndex
CREATE INDEX "SmtpSetting_branchId_idx" ON "SmtpSetting"("branchId");

-- CreateIndex
CREATE INDEX "SmtpSetting_isActive_idx" ON "SmtpSetting"("isActive");

-- CreateIndex
CREATE INDEX "SmtpSetting_isDefault_idx" ON "SmtpSetting"("isDefault");

-- CreateIndex
CREATE INDEX "SmtpSetting_companyId_branchId_idx" ON "SmtpSetting"("companyId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "SmtpSetting_name_companyId_branchId_key" ON "SmtpSetting"("name", "companyId", "branchId");

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

-- CreateIndex
CREATE INDEX "EmailNotification_companyId_idx" ON "EmailNotification"("companyId");

-- CreateIndex
CREATE INDEX "EmailNotification_branchId_idx" ON "EmailNotification"("branchId");

-- CreateIndex
CREATE INDEX "EmailNotification_type_idx" ON "EmailNotification"("type");

-- CreateIndex
CREATE INDEX "EmailNotification_isActive_idx" ON "EmailNotification"("isActive");

-- CreateIndex
CREATE INDEX "EmailNotification_frequency_idx" ON "EmailNotification"("frequency");

-- CreateIndex
CREATE INDEX "EmailNotification_companyId_branchId_idx" ON "EmailNotification"("companyId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailNotification_name_companyId_branchId_key" ON "EmailNotification"("name", "companyId", "branchId");

-- CreateIndex
CREATE INDEX "EmailSignature_companyId_idx" ON "EmailSignature"("companyId");

-- CreateIndex
CREATE INDEX "EmailSignature_branchId_idx" ON "EmailSignature"("branchId");

-- CreateIndex
CREATE INDEX "EmailSignature_userId_idx" ON "EmailSignature"("userId");

-- CreateIndex
CREATE INDEX "EmailSignature_isDefault_idx" ON "EmailSignature"("isDefault");

-- CreateIndex
CREATE INDEX "EmailSignature_isActive_idx" ON "EmailSignature"("isActive");

-- CreateIndex
CREATE INDEX "EmailSignature_companyId_branchId_idx" ON "EmailSignature"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "EmailSignature_userId_companyId_idx" ON "EmailSignature"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSignature_name_userId_companyId_branchId_key" ON "EmailSignature"("name", "userId", "companyId", "branchId");

-- CreateIndex
CREATE INDEX "FormTemplate_companyId_idx" ON "FormTemplate"("companyId");

-- CreateIndex
CREATE INDEX "FormTemplate_branchId_idx" ON "FormTemplate"("branchId");

-- CreateIndex
CREATE INDEX "FormTemplate_entityType_idx" ON "FormTemplate"("entityType");

-- CreateIndex
CREATE INDEX "FormTemplate_isActive_idx" ON "FormTemplate"("isActive");

-- CreateIndex
CREATE INDEX "FormTemplate_workflowId_idx" ON "FormTemplate"("workflowId");

-- CreateIndex
CREATE INDEX "FormTemplate_companyId_branchId_idx" ON "FormTemplate"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "FormTemplate_customEntityName_idx" ON "FormTemplate"("customEntityName");

-- CreateIndex
CREATE UNIQUE INDEX "FormTemplate_name_companyId_branchId_key" ON "FormTemplate"("name", "companyId", "branchId");

-- CreateIndex
CREATE INDEX "PricingPlan_industry_idx" ON "PricingPlan"("industry");

-- CreateIndex
CREATE INDEX "PricingPlan_isActive_idx" ON "PricingPlan"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CustomEntityPage_templateId_key" ON "CustomEntityPage"("templateId");

-- CreateIndex
CREATE INDEX "CustomEntityPage_companyId_idx" ON "CustomEntityPage"("companyId");

-- CreateIndex
CREATE INDEX "CustomEntityPage_branchId_idx" ON "CustomEntityPage"("branchId");

-- CreateIndex
CREATE INDEX "CustomEntityPage_templateId_idx" ON "CustomEntityPage"("templateId");

-- CreateIndex
CREATE INDEX "CustomEntityPage_isActive_idx" ON "CustomEntityPage"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CustomEntityPage_slug_companyId_branchId_key" ON "CustomEntityPage"("slug", "companyId", "branchId");

-- CreateIndex
CREATE INDEX "EntityData_companyId_idx" ON "EntityData"("companyId");

-- CreateIndex
CREATE INDEX "EntityData_branchId_idx" ON "EntityData"("branchId");

-- CreateIndex
CREATE INDEX "EntityData_entityType_idx" ON "EntityData"("entityType");

-- CreateIndex
CREATE INDEX "EntityData_entityType_companyId_branchId_idx" ON "EntityData"("entityType", "companyId", "branchId");

-- CreateIndex
CREATE INDEX "EntityData_templateId_idx" ON "EntityData"("templateId");

-- CreateIndex
CREATE INDEX "EntityData_customEntityName_idx" ON "EntityData"("customEntityName");

-- CreateIndex
CREATE INDEX "EntityData_createdAt_idx" ON "EntityData"("createdAt");

-- CreateIndex
CREATE INDEX "FeedPost_userId_idx" ON "FeedPost"("userId");

-- CreateIndex
CREATE INDEX "FeedPost_companyId_idx" ON "FeedPost"("companyId");

-- CreateIndex
CREATE INDEX "FeedPost_branchId_idx" ON "FeedPost"("branchId");

-- CreateIndex
CREATE INDEX "FeedPost_createdAt_idx" ON "FeedPost"("createdAt");

-- CreateIndex
CREATE INDEX "FeedLike_postId_idx" ON "FeedLike"("postId");

-- CreateIndex
CREATE INDEX "FeedLike_userId_idx" ON "FeedLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedLike_postId_userId_key" ON "FeedLike"("postId", "userId");

-- CreateIndex
CREATE INDEX "FeedComment_postId_idx" ON "FeedComment"("postId");

-- CreateIndex
CREATE INDEX "FeedComment_userId_idx" ON "FeedComment"("userId");

-- CreateIndex
CREATE INDEX "FeedComment_createdAt_idx" ON "FeedComment"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_companyId_idx" ON "Notification"("companyId");

-- CreateIndex
CREATE INDEX "Notification_branchId_idx" ON "Notification"("branchId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Collab_createdById_idx" ON "Collab"("createdById");

-- CreateIndex
CREATE INDEX "Collab_companyId_idx" ON "Collab"("companyId");

-- CreateIndex
CREATE INDEX "Collab_branchId_idx" ON "Collab"("branchId");

-- CreateIndex
CREATE INDEX "Collab_status_idx" ON "Collab"("status");

-- CreateIndex
CREATE INDEX "Collab_createdAt_idx" ON "Collab"("createdAt");

-- CreateIndex
CREATE INDEX "CollabMember_collabId_idx" ON "CollabMember"("collabId");

-- CreateIndex
CREATE INDEX "CollabMember_userId_idx" ON "CollabMember"("userId");

-- CreateIndex
CREATE INDEX "CollabMember_email_idx" ON "CollabMember"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CollabMember_collabId_userId_key" ON "CollabMember"("collabId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CollabMember_collabId_email_key" ON "CollabMember"("collabId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "CollabInvitation_token_key" ON "CollabInvitation"("token");

-- CreateIndex
CREATE INDEX "CollabInvitation_collabId_idx" ON "CollabInvitation"("collabId");

-- CreateIndex
CREATE INDEX "CollabInvitation_email_idx" ON "CollabInvitation"("email");

-- CreateIndex
CREATE INDEX "CollabInvitation_token_idx" ON "CollabInvitation"("token");

-- CreateIndex
CREATE INDEX "CollabInvitation_status_idx" ON "CollabInvitation"("status");

-- CreateIndex
CREATE INDEX "CollabInvitation_invitedById_idx" ON "CollabInvitation"("invitedById");

-- CreateIndex
CREATE INDEX "WorkGroup_createdById_idx" ON "WorkGroup"("createdById");

-- CreateIndex
CREATE INDEX "WorkGroup_companyId_idx" ON "WorkGroup"("companyId");

-- CreateIndex
CREATE INDEX "WorkGroup_branchId_idx" ON "WorkGroup"("branchId");

-- CreateIndex
CREATE INDEX "WorkGroup_status_idx" ON "WorkGroup"("status");

-- CreateIndex
CREATE INDEX "WorkGroup_createdAt_idx" ON "WorkGroup"("createdAt");

-- CreateIndex
CREATE INDEX "WorkGroupMember_workGroupId_idx" ON "WorkGroupMember"("workGroupId");

-- CreateIndex
CREATE INDEX "WorkGroupMember_userId_idx" ON "WorkGroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkGroupMember_workGroupId_userId_key" ON "WorkGroupMember"("workGroupId", "userId");

-- CreateIndex
CREATE INDEX "Document_createdById_idx" ON "Document"("createdById");

-- CreateIndex
CREATE INDEX "Document_companyId_idx" ON "Document"("companyId");

-- CreateIndex
CREATE INDEX "Document_branchId_idx" ON "Document"("branchId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_idx" ON "CalendarEvent"("userId");

-- CreateIndex
CREATE INDEX "CalendarEvent_companyId_idx" ON "CalendarEvent"("companyId");

-- CreateIndex
CREATE INDEX "CalendarEvent_branchId_idx" ON "CalendarEvent"("branchId");

-- CreateIndex
CREATE INDEX "CalendarEvent_start_idx" ON "CalendarEvent"("start");

-- CreateIndex
CREATE INDEX "CalendarEvent_end_idx" ON "CalendarEvent"("end");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_start_end_idx" ON "CalendarEvent"("userId", "start", "end");

-- CreateIndex
CREATE INDEX "FitnessActivity_userId_idx" ON "FitnessActivity"("userId");

-- CreateIndex
CREATE INDEX "FitnessActivity_companyId_idx" ON "FitnessActivity"("companyId");

-- CreateIndex
CREATE INDEX "FitnessActivity_branchId_idx" ON "FitnessActivity"("branchId");

-- CreateIndex
CREATE INDEX "FitnessActivity_type_idx" ON "FitnessActivity"("type");

-- CreateIndex
CREATE INDEX "FitnessActivity_status_idx" ON "FitnessActivity"("status");

-- CreateIndex
CREATE INDEX "FitnessActivity_startTime_idx" ON "FitnessActivity"("startTime");

-- CreateIndex
CREATE INDEX "FitnessActivity_userId_startTime_idx" ON "FitnessActivity"("userId", "startTime");

-- CreateIndex
CREATE INDEX "NutritionEntry_userId_idx" ON "NutritionEntry"("userId");

-- CreateIndex
CREATE INDEX "NutritionEntry_companyId_idx" ON "NutritionEntry"("companyId");

-- CreateIndex
CREATE INDEX "NutritionEntry_branchId_idx" ON "NutritionEntry"("branchId");

-- CreateIndex
CREATE INDEX "NutritionEntry_date_idx" ON "NutritionEntry"("date");

-- CreateIndex
CREATE INDEX "NutritionEntry_userId_date_idx" ON "NutritionEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionEntry_userId_date_key" ON "NutritionEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "SleepRecord_userId_idx" ON "SleepRecord"("userId");

-- CreateIndex
CREATE INDEX "SleepRecord_companyId_idx" ON "SleepRecord"("companyId");

-- CreateIndex
CREATE INDEX "SleepRecord_branchId_idx" ON "SleepRecord"("branchId");

-- CreateIndex
CREATE INDEX "SleepRecord_date_idx" ON "SleepRecord"("date");

-- CreateIndex
CREATE INDEX "SleepRecord_userId_date_idx" ON "SleepRecord"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SleepRecord_userId_date_key" ON "SleepRecord"("userId", "date");

-- CreateIndex
CREATE INDEX "ProductCategory_companyId_idx" ON "ProductCategory"("companyId");

-- CreateIndex
CREATE INDEX "ProductCategory_branchId_idx" ON "ProductCategory"("branchId");

-- CreateIndex
CREATE INDEX "ProductCategory_isActive_idx" ON "ProductCategory"("isActive");

-- CreateIndex
CREATE INDEX "ProductCategory_companyId_branchId_idx" ON "ProductCategory"("companyId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_name_companyId_branchId_key" ON "ProductCategory"("name", "companyId", "branchId");

-- CreateIndex
CREATE INDEX "ProductSubCategory_categoryId_idx" ON "ProductSubCategory"("categoryId");

-- CreateIndex
CREATE INDEX "ProductSubCategory_companyId_idx" ON "ProductSubCategory"("companyId");

-- CreateIndex
CREATE INDEX "ProductSubCategory_branchId_idx" ON "ProductSubCategory"("branchId");

-- CreateIndex
CREATE INDEX "ProductSubCategory_isActive_idx" ON "ProductSubCategory"("isActive");

-- CreateIndex
CREATE INDEX "ProductSubCategory_companyId_branchId_idx" ON "ProductSubCategory"("companyId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSubCategory_name_categoryId_companyId_branchId_key" ON "ProductSubCategory"("name", "categoryId", "companyId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_companyId_idx" ON "Product"("companyId");

-- CreateIndex
CREATE INDEX "Product_branchId_idx" ON "Product"("branchId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_sub_category_idx" ON "Product"("sub_category");

-- CreateIndex
CREATE INDEX "Product_createdById_idx" ON "Product"("createdById");

-- CreateIndex
CREATE INDEX "Product_updatedById_idx" ON "Product"("updatedById");

-- CreateIndex
CREATE INDEX "Product_productType_idx" ON "Product"("productType");

-- CreateIndex
CREATE INDEX "Customer_companyId_idx" ON "Customer"("companyId");

-- CreateIndex
CREATE INDEX "Customer_branchId_idx" ON "Customer"("branchId");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_companyId_idx" ON "Order"("companyId");

-- CreateIndex
CREATE INDEX "Order_branchId_idx" ON "Order"("branchId");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_orderDate_idx" ON "Order"("orderDate");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_companyId_branchId_idx" ON "Order"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "Folder_companyId_idx" ON "Folder"("companyId");

-- CreateIndex
CREATE INDEX "Folder_branchId_idx" ON "Folder"("branchId");

-- CreateIndex
CREATE INDEX "Folder_userId_idx" ON "Folder"("userId");

-- CreateIndex
CREATE INDEX "Folder_parentFolderId_idx" ON "Folder"("parentFolderId");

-- CreateIndex
CREATE INDEX "Folder_starred_idx" ON "Folder"("starred");

-- CreateIndex
CREATE INDEX "File_companyId_idx" ON "File"("companyId");

-- CreateIndex
CREATE INDEX "File_branchId_idx" ON "File"("branchId");

-- CreateIndex
CREATE INDEX "File_userId_idx" ON "File"("userId");

-- CreateIndex
CREATE INDEX "File_folderId_idx" ON "File"("folderId");

-- CreateIndex
CREATE INDEX "File_type_idx" ON "File"("type");

-- CreateIndex
CREATE INDEX "File_starred_idx" ON "File"("starred");

-- CreateIndex
CREATE INDEX "File_createdAt_idx" ON "File"("createdAt");

-- CreateIndex
CREATE INDEX "Project_companyId_idx" ON "Project"("companyId");

-- CreateIndex
CREATE INDEX "Project_branchId_idx" ON "Project"("branchId");

-- CreateIndex
CREATE INDEX "Project_managerId_idx" ON "Project"("managerId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_startDate_idx" ON "Project"("startDate");

-- CreateIndex
CREATE INDEX "Project_endDate_idx" ON "Project"("endDate");

-- CreateIndex
CREATE INDEX "Project_deadline_idx" ON "Project"("deadline");

-- CreateIndex
CREATE INDEX "Project_companyId_branchId_idx" ON "Project"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "ProjectMember_projectId_idx" ON "ProjectMember"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");

-- CreateIndex
CREATE INDEX "MenuItem_group_order_idx" ON "MenuItem"("group", "order");

-- CreateIndex
CREATE INDEX "MenuItem_parentId_order_idx" ON "MenuItem"("parentId", "order");

-- CreateIndex
CREATE INDEX "MenuItem_companyId_idx" ON "MenuItem"("companyId");

-- CreateIndex
CREATE INDEX "MenuItem_branchId_idx" ON "MenuItem"("branchId");

-- CreateIndex
CREATE INDEX "Reminder_companyId_idx" ON "Reminder"("companyId");

-- CreateIndex
CREATE INDEX "Reminder_branchId_idx" ON "Reminder"("branchId");

-- CreateIndex
CREATE INDEX "Reminder_userId_idx" ON "Reminder"("userId");

-- CreateIndex
CREATE INDEX "Reminder_isCompleted_idx" ON "Reminder"("isCompleted");

-- CreateIndex
CREATE INDEX "Reminder_dueDate_idx" ON "Reminder"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPayment_paymentNumber_key" ON "CustomerPayment"("paymentNumber");

-- CreateIndex
CREATE INDEX "CustomerPayment_companyId_idx" ON "CustomerPayment"("companyId");

-- CreateIndex
CREATE INDEX "CustomerPayment_branchId_idx" ON "CustomerPayment"("branchId");

-- CreateIndex
CREATE INDEX "CustomerPayment_customerId_idx" ON "CustomerPayment"("customerId");

-- CreateIndex
CREATE INDEX "CustomerPayment_orderId_idx" ON "CustomerPayment"("orderId");

-- CreateIndex
CREATE INDEX "CustomerPayment_status_idx" ON "CustomerPayment"("status");

-- CreateIndex
CREATE INDEX "CustomerPayment_paymentDate_idx" ON "CustomerPayment"("paymentDate");

-- CreateIndex
CREATE INDEX "CustomerPayment_paymentNumber_idx" ON "CustomerPayment"("paymentNumber");

-- CreateIndex
CREATE INDEX "CustomerPayment_companyId_branchId_idx" ON "CustomerPayment"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "LoginHistory_userId_idx" ON "LoginHistory"("userId");

-- CreateIndex
CREATE INDEX "LoginHistory_companyId_idx" ON "LoginHistory"("companyId");

-- CreateIndex
CREATE INDEX "LoginHistory_branchId_idx" ON "LoginHistory"("branchId");

-- CreateIndex
CREATE INDEX "LoginHistory_loginAt_idx" ON "LoginHistory"("loginAt");

-- CreateIndex
CREATE INDEX "LoginHistory_companyId_branchId_idx" ON "LoginHistory"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "LoginHistory_userId_loginAt_idx" ON "LoginHistory"("userId", "loginAt");

-- CreateIndex
CREATE INDEX "Supplier_companyId_idx" ON "Supplier"("companyId");

-- CreateIndex
CREATE INDEX "Supplier_branchId_idx" ON "Supplier"("branchId");

-- CreateIndex
CREATE INDEX "Supplier_email_idx" ON "Supplier"("email");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPayment_paymentNumber_key" ON "SupplierPayment"("paymentNumber");

-- CreateIndex
CREATE INDEX "SupplierPayment_companyId_idx" ON "SupplierPayment"("companyId");

-- CreateIndex
CREATE INDEX "SupplierPayment_branchId_idx" ON "SupplierPayment"("branchId");

-- CreateIndex
CREATE INDEX "SupplierPayment_supplierId_idx" ON "SupplierPayment"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierPayment_status_idx" ON "SupplierPayment"("status");

-- CreateIndex
CREATE INDEX "SupplierPayment_paymentDate_idx" ON "SupplierPayment"("paymentDate");

-- CreateIndex
CREATE INDEX "SupplierPayment_paymentNumber_idx" ON "SupplierPayment"("paymentNumber");

-- CreateIndex
CREATE INDEX "SupplierPayment_companyId_branchId_idx" ON "SupplierPayment"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "StorageQuota_companyId_idx" ON "StorageQuota"("companyId");

-- CreateIndex
CREATE INDEX "StorageQuota_branchId_idx" ON "StorageQuota"("branchId");

-- CreateIndex
CREATE INDEX "StorageQuota_companyId_branchId_idx" ON "StorageQuota"("companyId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "StorageQuota_companyId_branchId_key" ON "StorageQuota"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "SystemSetting_companyId_idx" ON "SystemSetting"("companyId");

-- CreateIndex
CREATE INDEX "SystemSetting_branchId_idx" ON "SystemSetting"("branchId");

-- CreateIndex
CREATE INDEX "SystemSetting_key_idx" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSetting_companyId_branchId_idx" ON "SystemSetting"("companyId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_companyId_branchId_key" ON "SystemSetting"("key", "companyId", "branchId");

-- CreateIndex
CREATE INDEX "ExceptionLog_companyId_idx" ON "ExceptionLog"("companyId");

-- CreateIndex
CREATE INDEX "ExceptionLog_branchId_idx" ON "ExceptionLog"("branchId");

-- CreateIndex
CREATE INDEX "ExceptionLog_userId_idx" ON "ExceptionLog"("userId");

-- CreateIndex
CREATE INDEX "ExceptionLog_severity_idx" ON "ExceptionLog"("severity");

-- CreateIndex
CREATE INDEX "ExceptionLog_resolved_idx" ON "ExceptionLog"("resolved");

-- CreateIndex
CREATE INDEX "ExceptionLog_source_idx" ON "ExceptionLog"("source");

-- CreateIndex
CREATE INDEX "ExceptionLog_createdAt_idx" ON "ExceptionLog"("createdAt");

-- CreateIndex
CREATE INDEX "ExceptionLog_companyId_branchId_idx" ON "ExceptionLog"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "ExceptionLog_severity_resolved_idx" ON "ExceptionLog"("severity", "resolved");

-- CreateIndex
CREATE UNIQUE INDEX "OrderReturn_returnNumber_key" ON "OrderReturn"("returnNumber");

-- CreateIndex
CREATE INDEX "OrderReturn_companyId_idx" ON "OrderReturn"("companyId");

-- CreateIndex
CREATE INDEX "OrderReturn_branchId_idx" ON "OrderReturn"("branchId");

-- CreateIndex
CREATE INDEX "OrderReturn_orderId_idx" ON "OrderReturn"("orderId");

-- CreateIndex
CREATE INDEX "OrderReturn_customerId_idx" ON "OrderReturn"("customerId");

-- CreateIndex
CREATE INDEX "OrderReturn_status_idx" ON "OrderReturn"("status");

-- CreateIndex
CREATE INDEX "OrderReturn_returnDate_idx" ON "OrderReturn"("returnDate");

-- CreateIndex
CREATE INDEX "OrderReturn_returnNumber_idx" ON "OrderReturn"("returnNumber");

-- CreateIndex
CREATE INDEX "OrderReturn_processedById_idx" ON "OrderReturn"("processedById");

-- CreateIndex
CREATE INDEX "OrderReturn_companyId_branchId_idx" ON "OrderReturn"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "OrderReturnItem_returnId_idx" ON "OrderReturnItem"("returnId");

-- CreateIndex
CREATE INDEX "OrderReturnItem_orderItemId_idx" ON "OrderReturnItem"("orderItemId");

-- CreateIndex
CREATE INDEX "OrderReturnItem_productId_idx" ON "OrderReturnItem"("productId");

-- CreateIndex
CREATE INDEX "TableCategory_companyId_idx" ON "TableCategory"("companyId");

-- CreateIndex
CREATE INDEX "TableCategory_branchId_idx" ON "TableCategory"("branchId");

-- CreateIndex
CREATE INDEX "TableCategory_companyId_branchId_idx" ON "TableCategory"("companyId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "TableCategory_name_companyId_branchId_key" ON "TableCategory"("name", "companyId", "branchId");

-- CreateIndex
CREATE INDEX "Table_categoryId_idx" ON "Table"("categoryId");

-- CreateIndex
CREATE INDEX "Table_companyId_idx" ON "Table"("companyId");

-- CreateIndex
CREATE INDEX "Table_branchId_idx" ON "Table"("branchId");

-- CreateIndex
CREATE INDEX "Table_status_idx" ON "Table"("status");

-- CreateIndex
CREATE INDEX "Table_companyId_branchId_idx" ON "Table"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "ReportTemplate_companyId_idx" ON "ReportTemplate"("companyId");

-- CreateIndex
CREATE INDEX "ReportTemplate_branchId_idx" ON "ReportTemplate"("branchId");

-- CreateIndex
CREATE INDEX "ReportTemplate_entityType_idx" ON "ReportTemplate"("entityType");

-- CreateIndex
CREATE INDEX "ReportTemplate_companyId_branchId_idx" ON "ReportTemplate"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "PdfReport_companyId_idx" ON "PdfReport"("companyId");

-- CreateIndex
CREATE INDEX "PdfReport_branchId_idx" ON "PdfReport"("branchId");

-- CreateIndex
CREATE INDEX "PdfReport_entityType_idx" ON "PdfReport"("entityType");

-- CreateIndex
CREATE INDEX "PdfReport_isActive_idx" ON "PdfReport"("isActive");

-- CreateIndex
CREATE INDEX "PdfReport_companyId_branchId_idx" ON "PdfReport"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "DealDashboard_companyId_idx" ON "DealDashboard"("companyId");

-- CreateIndex
CREATE INDEX "DealDashboard_branchId_idx" ON "DealDashboard"("branchId");

-- CreateIndex
CREATE INDEX "DealDashboard_createdById_idx" ON "DealDashboard"("createdById");

-- CreateIndex
CREATE INDEX "DealDashboard_visibility_idx" ON "DealDashboard"("visibility");

-- CreateIndex
CREATE INDEX "DealDashboardRoleShare_dashboardId_idx" ON "DealDashboardRoleShare"("dashboardId");

-- CreateIndex
CREATE INDEX "DealDashboardRoleShare_roleId_idx" ON "DealDashboardRoleShare"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "DealDashboardRoleShare_dashboardId_roleId_key" ON "DealDashboardRoleShare"("dashboardId", "roleId");

-- CreateIndex
CREATE INDEX "DealDashboardUserShare_dashboardId_idx" ON "DealDashboardUserShare"("dashboardId");

-- CreateIndex
CREATE INDEX "DealDashboardUserShare_userId_idx" ON "DealDashboardUserShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DealDashboardUserShare_dashboardId_userId_key" ON "DealDashboardUserShare"("dashboardId", "userId");

-- CreateIndex
CREATE INDEX "DealDashboardUserPref_userId_idx" ON "DealDashboardUserPref"("userId");

-- CreateIndex
CREATE INDEX "DealDashboardUserPref_dashboardId_idx" ON "DealDashboardUserPref"("dashboardId");

-- CreateIndex
CREATE UNIQUE INDEX "DealDashboardUserPref_dashboardId_userId_key" ON "DealDashboardUserPref"("dashboardId", "userId");

-- CreateIndex
CREATE INDEX "_NoteToNoteLabel_B_index" ON "_NoteToNoteLabel"("B");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConnection" ADD CONSTRAINT "UserConnection_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConnection" ADD CONSTRAINT "UserConnection_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteLabel" ADD CONSTRAINT "NoteLabel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteChecklistItem" ADD CONSTRAINT "NoteChecklistItem_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSection" ADD CONSTRAINT "FormSection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FormSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSectionPermission" ADD CONSTRAINT "FormSectionPermission_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FormSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSectionPermission" ADD CONSTRAINT "FormSectionPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSectionPermission" ADD CONSTRAINT "FormSectionPermission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSectionPermission" ADD CONSTRAINT "FormSectionPermission_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormFieldPermission" ADD CONSTRAINT "FormFieldPermission_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "FormField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormFieldPermission" ADD CONSTRAINT "FormFieldPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormFieldPermission" ADD CONSTRAINT "FormFieldPermission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormFieldPermission" ADD CONSTRAINT "FormFieldPermission_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAccess" ADD CONSTRAINT "ChatAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAccess" ADD CONSTRAINT "ChatAccess_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAccess" ADD CONSTRAINT "ChatAccess_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAccess" ADD CONSTRAINT "ChatAccess_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TodoComment" ADD CONSTRAINT "TodoComment_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TodoFile" ADD CONSTRAINT "TodoFile_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TodoSubTask" ADD CONSTRAINT "TodoSubTask_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadStage" ADD CONSTRAINT "LeadStage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadStage" ADD CONSTRAINT "LeadStage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentStage" ADD CONSTRAINT "DocumentStage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentStage" ADD CONSTRAINT "DocumentStage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceStage" ADD CONSTRAINT "InvoiceStage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceStage" ADD CONSTRAINT "InvoiceStage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateStage" ADD CONSTRAINT "EstimateStage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateStage" ADD CONSTRAINT "EstimateStage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactType" ADD CONSTRAINT "ContactType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactType" ADD CONSTRAINT "ContactType_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salutation" ADD CONSTRAINT "Salutation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salutation" ADD CONSTRAINT "Salutation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallStatus" ADD CONSTRAINT "CallStatus_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallStatus" ADD CONSTRAINT "CallStatus_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyType" ADD CONSTRAINT "CompanyType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyType" ADD CONSTRAINT "CompanyType_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Industry" ADD CONSTRAINT "Industry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Industry" ADD CONSTRAINT "Industry_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealType" ADD CONSTRAINT "DealType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealType" ADD CONSTRAINT "DealType_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Currency" ADD CONSTRAINT "Currency_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Currency" ADD CONSTRAINT "Currency_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tax" ADD CONSTRAINT "Tax_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tax" ADD CONSTRAINT "Tax_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitOfMeasurement" ADD CONSTRAINT "UnitOfMeasurement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitOfMeasurement" ADD CONSTRAINT "UnitOfMeasurement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductProperty" ADD CONSTRAINT "ProductProperty_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductProperty" ADD CONSTRAINT "ProductProperty_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealPipeline" ADD CONSTRAINT "DealPipeline_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealPipeline" ADD CONSTRAINT "DealPipeline_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "DealPipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineConnection" ADD CONSTRAINT "PipelineConnection_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "PipelineStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineConnection" ADD CONSTRAINT "PipelineConnection_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "PipelineStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessControl" ADD CONSTRAINT "AccessControl_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessControl" ADD CONSTRAINT "AccessControl_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Security" ADD CONSTRAINT "Security_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Security" ADD CONSTRAINT "Security_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticalReport" ADD CONSTRAINT "AnalyticalReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticalReport" ADD CONSTRAINT "AnalyticalReport_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoNumbering" ADD CONSTRAINT "AutoNumbering_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoNumbering" ADD CONSTRAINT "AutoNumbering_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionSetting" ADD CONSTRAINT "PermissionSetting_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionSetting" ADD CONSTRAINT "PermissionSetting_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PermissionSetting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionSetting" ADD CONSTRAINT "PermissionSetting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionSetting" ADD CONSTRAINT "PermissionSetting_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcess" ADD CONSTRAINT "BusinessProcess_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProcess" ADD CONSTRAINT "BusinessProcess_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmtpSetting" ADD CONSTRAINT "SmtpSetting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmtpSetting" ADD CONSTRAINT "SmtpSetting_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "EmailNotification" ADD CONSTRAINT "EmailNotification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailNotification" ADD CONSTRAINT "EmailNotification_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSignature" ADD CONSTRAINT "EmailSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSignature" ADD CONSTRAINT "EmailSignature_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSignature" ADD CONSTRAINT "EmailSignature_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTemplate" ADD CONSTRAINT "FormTemplate_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "BusinessProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTemplate" ADD CONSTRAINT "FormTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTemplate" ADD CONSTRAINT "FormTemplate_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomEntityPage" ADD CONSTRAINT "CustomEntityPage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomEntityPage" ADD CONSTRAINT "CustomEntityPage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomEntityPage" ADD CONSTRAINT "CustomEntityPage_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityData" ADD CONSTRAINT "EntityData_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityData" ADD CONSTRAINT "EntityData_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityData" ADD CONSTRAINT "EntityData_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedLike" ADD CONSTRAINT "FeedLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedLike" ADD CONSTRAINT "FeedLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collab" ADD CONSTRAINT "Collab_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collab" ADD CONSTRAINT "Collab_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collab" ADD CONSTRAINT "Collab_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollabMember" ADD CONSTRAINT "CollabMember_collabId_fkey" FOREIGN KEY ("collabId") REFERENCES "Collab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollabMember" ADD CONSTRAINT "CollabMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollabInvitation" ADD CONSTRAINT "CollabInvitation_collabId_fkey" FOREIGN KEY ("collabId") REFERENCES "Collab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollabInvitation" ADD CONSTRAINT "CollabInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkGroup" ADD CONSTRAINT "WorkGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkGroup" ADD CONSTRAINT "WorkGroup_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkGroup" ADD CONSTRAINT "WorkGroup_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkGroupMember" ADD CONSTRAINT "WorkGroupMember_workGroupId_fkey" FOREIGN KEY ("workGroupId") REFERENCES "WorkGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkGroupMember" ADD CONSTRAINT "WorkGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitnessActivity" ADD CONSTRAINT "FitnessActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitnessActivity" ADD CONSTRAINT "FitnessActivity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitnessActivity" ADD CONSTRAINT "FitnessActivity_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionEntry" ADD CONSTRAINT "NutritionEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionEntry" ADD CONSTRAINT "NutritionEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionEntry" ADD CONSTRAINT "NutritionEntry_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SleepRecord" ADD CONSTRAINT "SleepRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SleepRecord" ADD CONSTRAINT "SleepRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SleepRecord" ADD CONSTRAINT "SleepRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSubCategory" ADD CONSTRAINT "ProductSubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSubCategory" ADD CONSTRAINT "ProductSubCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSubCategory" ADD CONSTRAINT "ProductSubCategory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageQuota" ADD CONSTRAINT "StorageQuota_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageQuota" ADD CONSTRAINT "StorageQuota_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExceptionLog" ADD CONSTRAINT "ExceptionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExceptionLog" ADD CONSTRAINT "ExceptionLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExceptionLog" ADD CONSTRAINT "ExceptionLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReturn" ADD CONSTRAINT "OrderReturn_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReturn" ADD CONSTRAINT "OrderReturn_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReturn" ADD CONSTRAINT "OrderReturn_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReturn" ADD CONSTRAINT "OrderReturn_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReturn" ADD CONSTRAINT "OrderReturn_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReturnItem" ADD CONSTRAINT "OrderReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "OrderReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReturnItem" ADD CONSTRAINT "OrderReturnItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReturnItem" ADD CONSTRAINT "OrderReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableCategory" ADD CONSTRAINT "TableCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableCategory" ADD CONSTRAINT "TableCategory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TableCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTemplate" ADD CONSTRAINT "ReportTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTemplate" ADD CONSTRAINT "ReportTemplate_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTemplate" ADD CONSTRAINT "ReportTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTemplate" ADD CONSTRAINT "ReportTemplate_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdfReport" ADD CONSTRAINT "PdfReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdfReport" ADD CONSTRAINT "PdfReport_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdfReport" ADD CONSTRAINT "PdfReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdfReport" ADD CONSTRAINT "PdfReport_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealDashboard" ADD CONSTRAINT "DealDashboard_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealDashboard" ADD CONSTRAINT "DealDashboard_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealDashboard" ADD CONSTRAINT "DealDashboard_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealDashboardRoleShare" ADD CONSTRAINT "DealDashboardRoleShare_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "DealDashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealDashboardRoleShare" ADD CONSTRAINT "DealDashboardRoleShare_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealDashboardUserShare" ADD CONSTRAINT "DealDashboardUserShare_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "DealDashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealDashboardUserShare" ADD CONSTRAINT "DealDashboardUserShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealDashboardUserPref" ADD CONSTRAINT "DealDashboardUserPref_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "DealDashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealDashboardUserPref" ADD CONSTRAINT "DealDashboardUserPref_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NoteToNoteLabel" ADD CONSTRAINT "_NoteToNoteLabel_A_fkey" FOREIGN KEY ("A") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NoteToNoteLabel" ADD CONSTRAINT "_NoteToNoteLabel_B_fkey" FOREIGN KEY ("B") REFERENCES "NoteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

