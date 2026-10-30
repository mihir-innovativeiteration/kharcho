-- CreateTable
CREATE TABLE `RecurringRule` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` VARCHAR(255) NULL,
    `providerName` VARCHAR(100) NULL,
    `type` ENUM('INCOME', 'EXPENSE') NOT NULL DEFAULT 'EXPENSE',
    `amount` DECIMAL(19, 4) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `categoryId` VARCHAR(191) NULL,
    `paymentMethodId` VARCHAR(191) NULL,
    `frequency` ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL DEFAULT 'MONTHLY',
    `interval` INTEGER NOT NULL DEFAULT 1,
    `startDate` DATETIME(3) NOT NULL,
    `nextDueAt` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Kolkata',
    `reminderEnabled` BOOLEAN NOT NULL DEFAULT true,
    `reminderDaysBefore` INTEGER NOT NULL DEFAULT 1,
    `autoPost` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RecurringRule_userId_idx`(`userId`),
    INDEX `RecurringRule_userId_status_idx`(`userId`, `status`),
    INDEX `RecurringRule_status_nextDueAt_idx`(`status`, `nextDueAt`),
    INDEX `RecurringRule_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecurringOccurrence` (
    `id` VARCHAR(191) NOT NULL,
    `recurringRuleId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `occurrenceKey` VARCHAR(100) NOT NULL,
    `scheduledAt` DATETIME(3) NOT NULL,
    `status` ENUM('UPCOMING', 'DUE', 'AWAITING_CONFIRMATION', 'PAID', 'SKIPPED', 'FAILED') NOT NULL DEFAULT 'UPCOMING',
    `transactionId` VARCHAR(191) NULL,
    `reminderSentAt` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RecurringOccurrence_transactionId_key`(`transactionId`),
    UNIQUE INDEX `RecurringOccurrence_recurringRuleId_occurrenceKey_key`(`recurringRuleId`, `occurrenceKey`),
    INDEX `RecurringOccurrence_userId_idx`(`userId`),
    INDEX `RecurringOccurrence_userId_scheduledAt_idx`(`userId`, `scheduledAt`),
    INDEX `RecurringOccurrence_userId_status_idx`(`userId`, `status`),
    INDEX `RecurringOccurrence_recurringRuleId_scheduledAt_idx`(`recurringRuleId`, `scheduledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecurringReminder` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `ruleId` VARCHAR(191) NOT NULL,
    `occurrenceId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `message` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(19, 4) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `dueDate` DATETIME(3) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RecurringReminder_userId_occurrenceId_key`(`userId`, `occurrenceId`),
    INDEX `RecurringReminder_userId_idx`(`userId`),
    INDEX `RecurringReminder_userId_isRead_idx`(`userId`, `isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RecurringRule` ADD CONSTRAINT `RecurringRule_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurringRule` ADD CONSTRAINT `RecurringRule_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurringRule` ADD CONSTRAINT `RecurringRule_paymentMethodId_fkey` FOREIGN KEY (`paymentMethodId`) REFERENCES `PaymentMethod`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurringOccurrence` ADD CONSTRAINT `RecurringOccurrence_recurringRuleId_fkey` FOREIGN KEY (`recurringRuleId`) REFERENCES `RecurringRule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurringOccurrence` ADD CONSTRAINT `RecurringOccurrence_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurringOccurrence` ADD CONSTRAINT `RecurringOccurrence_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurringReminder` ADD CONSTRAINT `RecurringReminder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurringReminder` ADD CONSTRAINT `RecurringReminder_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `RecurringRule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurringReminder` ADD CONSTRAINT `RecurringReminder_occurrenceId_fkey` FOREIGN KEY (`occurrenceId`) REFERENCES `RecurringOccurrence`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
