#!/bin/bash
# =============================================================================
# CAARD - Vercel Deployment Script
# =============================================================================
# Run this script to deploy to Vercel production
# =============================================================================

set -e

echo "═══════════════════════════════════════════════════════════════════════"
echo "🚀 CAARD - Vercel Deployment"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not installed. Installing..."
    npm i -g vercel
fi

# Check if logged in
echo "📋 Checking Vercel authentication..."
vercel whoami || vercel login

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "Step 1: Environment Check"
echo "═══════════════════════════════════════════════════════════════════════"

# Check required environment variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
)

echo "Checking local environment variables..."
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "⚠️  Warning: $var is not set locally"
    else
        echo "✓  $var is set"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "Step 2: Build Test"
echo "═══════════════════════════════════════════════════════════════════════"

echo "Running local build test..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

echo "✓  Build successful!"

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "Step 3: Deploy to Vercel"
echo "═══════════════════════════════════════════════════════════════════════"

echo ""
echo "Choose deployment type:"
echo "  1) Preview (staging)"
echo "  2) Production"
echo ""
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo "Deploying to preview..."
        vercel
        ;;
    2)
        echo "Deploying to production..."
        vercel --prod
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "✅ Deployment Complete!"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Verify the deployment at the URL shown above"
echo "  2. Check the health endpoint: /api/health"
echo "  3. Run database migrations if needed: npx prisma db push"
echo "  4. Run seed if it's a fresh database: npx prisma db seed"
echo ""
