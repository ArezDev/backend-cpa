-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('ketua', 'member') NOT NULL DEFAULT 'member',
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `username`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_summary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user` VARCHAR(255) NOT NULL,
    `total_click` INTEGER NOT NULL DEFAULT 0,
    `total_lead` INTEGER NOT NULL DEFAULT 0,
    `total_earning` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_date` DATE NULL,
    `created_hour` VARCHAR(11) NULL,
    `created_week` VARCHAR(11) NULL,
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

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
    `created_at` DATETIME(0) NOT NULL,

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
    `created_at` DATETIME(0) NOT NULL,

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
    `created_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `realtime_access` (
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('uwong') NOT NULL,
    `id` INTEGER NOT NULL AUTO_INCREMENT,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `postplay_redirect` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url` TEXT NULL,
    `title` VARCHAR(255) NULL,
    `img` MEDIUMTEXT NULL,
    `descr` VARCHAR(255) NULL,
    `shortcode` VARCHAR(45) NULL,
    `user_id` VARCHAR(100) NULL,
    `hits` INTEGER NULL DEFAULT 0,
    `useragent` TEXT NULL,
    `last_accesed` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uniq_shortcode`(`shortcode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smartlinks` (
    `network` TEXT NOT NULL,
    `url` TEXT NOT NULL,
    `allowed` TEXT NOT NULL,
    `id` INTEGER NOT NULL AUTO_INCREMENT,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

