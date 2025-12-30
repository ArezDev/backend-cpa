-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NULL DEFAULT 'member',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `username`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smartlink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `network` VARCHAR(50) NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `allowed` VARCHAR(255) NULL,

    UNIQUE INDEX `network`(`network`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_summary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user` VARCHAR(255) NOT NULL,
    `total_click` INTEGER NOT NULL DEFAULT 0,
    `total_lead` INTEGER NOT NULL DEFAULT 0,
    `total_earning` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `created_date` DATE NULL,
    `created_hour` VARCHAR(11) NULL,
    `created_week` VARCHAR(11) NULL,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clicks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user` VARCHAR(255) NOT NULL,
    `network` VARCHAR(100) NOT NULL,
    `country` VARCHAR(10) NULL,
    `source` TEXT NULL,
    `gadget` VARCHAR(100) NULL,
    `ip` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `live_clicks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user` VARCHAR(255) NOT NULL,
    `network` VARCHAR(100) NOT NULL,
    `country` VARCHAR(10) NULL,
    `source` TEXT NULL,
    `gadget` VARCHAR(100) NULL,
    `ip` VARCHAR(45) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(255) NOT NULL,
    `network` VARCHAR(100) NOT NULL,
    `earning` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `country` VARCHAR(10) NULL,
    `useragent` TEXT NULL,
    `ip` VARCHAR(45) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `realtime_access` (
    `id` INTEGER NOT NULL DEFAULT 0,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'uwong',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

