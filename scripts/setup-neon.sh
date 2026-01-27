#!/bin/bash
# =============================================================================
# CAARD - Neon Database Setup Script
# =============================================================================
# Run this script to set up the Neon PostgreSQL database
# =============================================================================

set -e

echo "═══════════════════════════════════════════════════════════════════════"
echo "🗄️  CAARD - Neon PostgreSQL Setup"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set."
    echo ""
    echo "Please set your Neon connection string:"
    echo ""
    echo "  export DATABASE_URL='postgresql://user:pass@host/db?sslmode=require'"
    echo ""
    echo "You can find this in the Neon Dashboard:"
    echo "  1. Go to https://console.neon.tech"
    echo "  2. Select your project"
    echo "  3. Click 'Connection Details'"
    echo "  4. Copy the 'Connection string'"
    echo ""
    exit 1
fi

echo "✓  DATABASE_URL is set"
echo ""

echo "═══════════════════════════════════════════════════════════════════════"
echo "Step 1: Generate Prisma Client"
echo "═══════════════════════════════════════════════════════════════════════"

npx prisma generate
echo "✓  Prisma client generated"
echo ""

echo "═══════════════════════════════════════════════════════════════════════"
echo "Step 2: Push Schema to Database"
echo "═══════════════════════════════════════════════════════════════════════"

echo "This will sync the Prisma schema with your Neon database."
echo "⚠️  Warning: This may modify your database schema."
echo ""
read -p "Continue? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "Aborted."
    exit 0
fi

npx prisma db push
echo "✓  Schema pushed to database"
echo ""

echo "═══════════════════════════════════════════════════════════════════════"
echo "Step 3: Seed Database (Optional)"
echo "═══════════════════════════════════════════════════════════════════════"

echo ""
read -p "Would you like to seed the database with initial data? (y/n): " seed_confirm

if [ "$seed_confirm" = "y" ]; then
    npx prisma db seed
    echo "✓  Database seeded"
else
    echo "Skipped seeding."
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "✅ Neon Database Setup Complete!"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "Your database is ready to use."
echo ""
echo "Useful commands:"
echo "  npx prisma studio    - Open database GUI"
echo "  npx prisma db push   - Push schema changes"
echo "  npx prisma db seed   - Seed database"
echo "  npx prisma migrate   - Create migrations"
echo ""
