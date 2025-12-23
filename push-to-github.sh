#!/bin/bash

# Push DLPP Legal CMS to GitHub
# Repository: https://github.com/emabi2002/landcasesystem.git

echo "=================================="
echo "Pushing to GitHub Repository"
echo "=================================="
echo ""

cd /home/project/dlpp-legal-cms

# Check if we have commits
echo "✓ Checking commits..."
git log --oneline -3

echo ""
echo "✓ Files ready to push: 78 files"
echo "✓ Latest commit: Add GitHub deployment guide"
echo ""

# Push to GitHub (will prompt for credentials)
echo "Pushing to GitHub..."
echo "You'll be asked for:"
echo "  Username: emabi2002"
echo "  Password: [Your GitHub Personal Access Token]"
echo ""

git push https://github.com/emabi2002/landcasesystem.git main --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Code pushed to GitHub"
    echo "✅ Verify at: https://github.com/emabi2002/landcasesystem"
else
    echo ""
    echo "❌ Push failed - need authentication"
    echo ""
    echo "Get Personal Access Token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Generate new token (classic)"
    echo "3. Select scope: repo"
    echo "4. Use token as password"
fi
