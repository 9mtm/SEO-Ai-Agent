-- ============================================
-- Fix: Add Scraper Columns to Users Table
-- Run this ENTIRE script in phpMyAdmin SQL tab
-- ============================================

USE flowxtra_serp;

-- Check current table structure
DESCRIBE users;

-- Drop columns if they exist (cleanup)
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'flowxtra_serp'
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'scraper_type');
SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE users DROP COLUMN scraper_type', 'SELECT "scraper_type does not exist"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'flowxtra_serp'
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'scraper_api_key');
SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE users DROP COLUMN scraper_api_key', 'SELECT "scraper_api_key does not exist"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'flowxtra_serp'
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'proxy_list');
SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE users DROP COLUMN proxy_list', 'SELECT "proxy_list does not exist"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;

-- Now add the columns fresh
ALTER TABLE users
ADD COLUMN scraper_type VARCHAR(255) NULL DEFAULT 'none' AFTER google_ads_customer_id;

ALTER TABLE users
ADD COLUMN scraper_api_key TEXT NULL AFTER scraper_type;

ALTER TABLE users
ADD COLUMN proxy_list TEXT NULL AFTER scraper_api_key;

-- Verify
SELECT 'Scraper columns added successfully!' AS Status;

-- Show final structure
DESCRIBE users;
