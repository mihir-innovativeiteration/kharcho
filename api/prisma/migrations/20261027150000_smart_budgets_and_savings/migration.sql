-- AlterTable
ALTER TABLE `User` ADD COLUMN `budgetAlertsEnabled` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `Budget` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` ENUM('OVERALL', 'CATEGORY') NOT NULL DEFAULT 'CATEGORY',
    `categoryId` VARCHAR(191) NULL,
    `amount` DECIMAL(19, 4) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `period` ENUM('MONTHLY', 'CUSTOM') NOT NULL DEFAULT 'MONTHLY',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `warningThresholds` VARCHAR(191) NOT NULL DEFAULT '50,80,100',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Budget_userId_idx`(`userId`),
    INDEX `Budget_userId_isActive_idx`(`userId`, `isActive`),
    INDEX `Budget_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BudgetAlert` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `budgetId` VARCHAR(191) NOT NULL,
    `thresholdPercent` INTEGER NOT NULL,
    `periodKey` VARCHAR(50) NOT NULL,
    `triggeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BudgetAlert_budgetId_thresholdPercent_periodKey_key`(`budgetId`, `thresholdPercent`, `periodKey`),
    INDEX `BudgetAlert_userId_idx`(`userId`),
    INDEX `BudgetAlert_userId_readAt_idx`(`userId`, `readAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SavingsGoal` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `targetAmount` DECIMAL(19, 4) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `targetDate` DATETIME(3) NULL,
    `icon` VARCHAR(50) NULL,
    `color` VARCHAR(20) NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SavingsGoal_userId_idx`(`userId`),
    INDEX `SavingsGoal_userId_status_idx`(`userId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SavingsContribution` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `goalId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(19, 4) NOT NULL,
    `contributionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `note` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SavingsContribution_userId_idx`(`userId`),
    INDEX `SavingsContribution_goalId_idx`(`goalId`),
    INDEX `SavingsContribution_goalId_contributionDate_idx`(`goalId`, `contributionDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Budget` ADD CONSTRAINT `Budget_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Budget` ADD CONSTRAINT `Budget_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BudgetAlert` ADD CONSTRAINT `BudgetAlert_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BudgetAlert` ADD CONSTRAINT `BudgetAlert_budgetId_fkey` FOREIGN KEY (`budgetId`) REFERENCES `Budget`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavingsGoal` ADD CONSTRAINT `SavingsGoal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavingsContribution` ADD CONSTRAINT `SavingsContribution_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavingsContribution` ADD CONSTRAINT `SavingsContribution_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `SavingsGoal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
