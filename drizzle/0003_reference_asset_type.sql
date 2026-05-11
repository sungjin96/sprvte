-- Add 'reference' to asset_type enum for reference image uploads
ALTER TYPE "asset_type" ADD VALUE IF NOT EXISTS 'reference';
