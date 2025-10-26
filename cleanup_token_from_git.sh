#!/bin/bash
# Remove Hardcoded Tokens from Git History
# WARNING: This rewrites git history - only run if you understand the implications

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}⚠️  GIT HISTORY CLEANUP - REMOVE EXPOSED TOKENS${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}This script will:${NC}"
echo -e "  1. Remove files with hardcoded tokens from git history"
echo -e "  2. Force push the cleaned history to GitHub"
echo -e "  3. Permanently delete the old token references"
echo ""
echo -e "${RED}⚠️  WARNING: This rewrites git history!${NC}"
echo -e "${YELLOW}   • All collaborators will need to re-clone the repo${NC}"
echo -e "${YELLOW}   • Old commits will be modified${NC}"
echo -e "${YELLOW}   • This cannot be undone${NC}"
echo ""

read -p "$(echo -e ${YELLOW}Are you sure you want to continue? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Step 1: Checking for files with hardcoded tokens...${NC}"

# Files to remove from history
FILES_TO_REMOVE=(
    "fix_hf_token.sh"
    "fix_huggingface.sh"
)

echo -e "${YELLOW}Files to remove from git history:${NC}"
for file in "${FILES_TO_REMOVE[@]}"; do
    if git log --all --pretty=format: --name-only --diff-filter=A | grep -q "^$file$"; then
        echo -e "  ${RED}✗${NC} $file ${YELLOW}(found in history)${NC}"
    else
        echo -e "  ${GREEN}✓${NC} $file ${YELLOW}(not in history)${NC}"
    fi
done

echo ""
read -p "$(echo -e ${YELLOW}Proceed with removal? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Step 2: Creating backup...${NC}"
BACKUP_BRANCH="backup-before-token-cleanup-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH"
echo -e "${GREEN}✅ Created backup branch: $BACKUP_BRANCH${NC}"

echo ""
echo -e "${YELLOW}Step 3: Removing files from git history...${NC}"

for file in "${FILES_TO_REMOVE[@]}"; do
    echo -e "${YELLOW}   Removing $file...${NC}"
    git filter-branch --force --index-filter \
        "git rm --cached --ignore-unmatch $file" \
        --prune-empty --tag-name-filter cat -- --all 2>/dev/null || true
done

echo -e "${GREEN}✅ Files removed from history${NC}"

echo ""
echo -e "${YELLOW}Step 4: Cleaning up refs and garbage collection...${NC}"
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
echo -e "${GREEN}✅ Cleanup complete${NC}"

echo ""
echo -e "${YELLOW}Step 5: Verifying removal...${NC}"

# Check if tokens still exist in history
if git log --all --pretty=format: --name-only | grep -q "fix_hf_token.sh\|fix_huggingface.sh"; then
    echo -e "${RED}⚠️  Warning: Files may still exist in some commits${NC}"
else
    echo -e "${GREEN}✅ Files successfully removed from all commits${NC}"
fi

# Check for hardcoded tokens
if git grep "hf_[a-zA-Z0-9]\{34\}" $(git rev-list --all) 2>/dev/null | head -n 1; then
    echo -e "${RED}⚠️  Warning: Hardcoded tokens still found in history${NC}"
    echo -e "${YELLOW}   Run: git grep 'hf_' \$(git rev-list --all)${NC}"
else
    echo -e "${GREEN}✅ No hardcoded tokens found in history${NC}"
fi

echo ""
echo -e "${YELLOW}Step 6: Ready to force push to GitHub...${NC}"
echo ""
echo -e "${RED}⚠️  FINAL WARNING:${NC}"
echo -e "  • This will ${RED}FORCE PUSH${NC} to origin/main"
echo -e "  • Old history will be ${RED}PERMANENTLY DELETED${NC} from GitHub"
echo -e "  • Backup saved in branch: ${BLUE}$BACKUP_BRANCH${NC}"
echo ""

read -p "$(echo -e ${RED}Force push to GitHub? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Skipped force push.${NC}"
    echo -e "${YELLOW}To push manually later:${NC}"
    echo -e "  git push origin main --force"
    exit 0
fi

echo ""
echo -e "${YELLOW}Force pushing to GitHub...${NC}"
git push origin main --force

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully pushed cleaned history to GitHub!${NC}"
else
    echo -e "${RED}❌ Force push failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Cleanup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}What happened:${NC}"
echo -e "  • Removed hardcoded token files from git history"
echo -e "  • Force pushed cleaned history to GitHub"
echo -e "  • Created backup branch: ${BLUE}$BACKUP_BRANCH${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "  1. Get new HF token: ${BLUE}https://huggingface.co/settings/tokens${NC}"
echo -e "  2. Run: ${BLUE}./setup_hf_token.sh${NC}"
echo -e "  3. Verify token is NOT in git: ${BLUE}git status${NC}"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo -e "  • Old tokens in GitHub history are now removed"
echo -e "  • Invalidate the old token on HuggingFace to be safe"
echo -e "  • Never commit .env or tokens to git again"
echo ""
