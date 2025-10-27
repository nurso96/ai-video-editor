#!/bin/bash
# Clean Up Frontend Directory - Remove Corrupted Files
# This removes micromamba package files and nested frontend directory

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧹 Frontend Directory Cleanup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

FRONTEND_DIR="/home/nick/ai-video-editor/frontend"

echo -e "${YELLOW}🔍 Analysis:${NC}"
echo ""
echo -e "${RED}Problem found:${NC}"
echo -e "  1. Micromamba package files polluting frontend/ directory"
echo -e "  2. Nested frontend/frontend/ directory (redundant)"
echo ""
echo -e "${GREEN}What this script will do:${NC}"
echo -e "  1. Remove conda/micromamba package files (*.0, *_0 files)"
echo -e "  2. Remove nested frontend/frontend/ directory"
echo -e "  3. Keep the correct structure:"
echo -e "     ${BLUE}/home/nick/ai-video-editor/frontend/src/${NC} ← CORRECT"
echo ""

# Show what will be deleted
echo -e "${YELLOW}Files/directories to be removed:${NC}"
echo ""

# Count conda files
CONDA_FILES=$(find "$FRONTEND_DIR" -maxdepth 1 -type f \( -name "*-*_*" -o -name "*.*.*-*" \) ! -name "package*" ! -name "*.json" ! -name "*.js" ! -name "*.ts" ! -name "*.md" ! -name "*.yml" 2>/dev/null | wc -l)

if [ "$CONDA_FILES" -gt 0 ]; then
    echo -e "${RED}  ✗ $CONDA_FILES conda package files${NC}"
    find "$FRONTEND_DIR" -maxdepth 1 -type f \( -name "*-*_*" -o -name "*.*.*-*" \) ! -name "package*" ! -name "*.json" ! -name "*.js" ! -name "*.ts" ! -name "*.md" ! -name "*.yml" 2>/dev/null | head -5 | sed 's/^/    /'
    if [ "$CONDA_FILES" -gt 5 ]; then
        echo -e "    ${YELLOW}... and $(($CONDA_FILES - 5)) more${NC}"
    fi
fi

if [ -d "$FRONTEND_DIR/frontend" ]; then
    echo -e "${RED}  ✗ Nested frontend/frontend/ directory${NC}"
    echo -e "    ${YELLOW}(Only contains partial copy of src/)${NC}"
fi

echo ""
echo -e "${GREEN}What will be KEPT:${NC}"
echo -e "  ✓ frontend/src/ ${YELLOW}(main source code)${NC}"
echo -e "  ✓ frontend/node_modules/"
echo -e "  ✓ frontend/.next/"
echo -e "  ✓ frontend/package.json"
echo -e "  ✓ frontend/tsconfig.json"
echo -e "  ✓ All other normal files"
echo ""

read -p "$(echo -e ${YELLOW}Proceed with cleanup? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Step 1: Removing conda package files...${NC}"

# Remove conda package files
REMOVED_COUNT=0
while IFS= read -r -d '' file; do
    rm -f "$file"
    ((REMOVED_COUNT++))
done < <(find "$FRONTEND_DIR" -maxdepth 1 -type f \( -name "*-*_*" -o -name "*.*.*-*" \) ! -name "package*" ! -name "*.json" ! -name "*.js" ! -name "*.ts" ! -name "*.md" ! -name "*.yml" -print0 2>/dev/null)

echo -e "${GREEN}✅ Removed $REMOVED_COUNT conda package files${NC}"

echo ""
echo -e "${YELLOW}Step 2: Removing nested frontend/frontend/ directory...${NC}"

if [ -d "$FRONTEND_DIR/frontend" ]; then
    rm -rf "$FRONTEND_DIR/frontend"
    echo -e "${GREEN}✅ Removed nested frontend/frontend/ directory${NC}"
else
    echo -e "${BLUE}ℹ️  Nested directory already removed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Verifying correct structure...${NC}"

# Check for essential directories and files
ERRORS=0

if [ -d "$FRONTEND_DIR/src" ]; then
    echo -e "${GREEN}✅ frontend/src/ exists${NC}"
else
    echo -e "${RED}❌ frontend/src/ NOT found!${NC}"
    ((ERRORS++))
fi

if [ -f "$FRONTEND_DIR/package.json" ]; then
    echo -e "${GREEN}✅ package.json exists${NC}"
else
    echo -e "${RED}❌ package.json NOT found!${NC}"
    ((ERRORS++))
fi

if [ -d "$FRONTEND_DIR/src/components" ]; then
    echo -e "${GREEN}✅ src/components/ exists${NC}"
else
    echo -e "${RED}❌ src/components/ NOT found!${NC}"
    ((ERRORS++))
fi

if [ -d "$FRONTEND_DIR/src/pages" ]; then
    echo -e "${GREEN}✅ src/pages/ exists${NC}"
else
    echo -e "${RED}❌ src/pages/ NOT found!${NC}"
    ((ERRORS++))
fi

if [ -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${GREEN}✅ node_modules/ exists${NC}"
else
    echo -e "${YELLOW}⚠️  node_modules/ not found (run npm install)${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: Checking for remaining junk files...${NC}"

# Count remaining suspicious files
REMAINING=$(find "$FRONTEND_DIR" -maxdepth 1 -type f -name "*-*_*" ! -name "package*" 2>/dev/null | wc -l)

if [ "$REMAINING" -eq 0 ]; then
    echo -e "${GREEN}✅ No junk files remaining${NC}"
else
    echo -e "${YELLOW}⚠️  Found $REMAINING suspicious files:${NC}"
    find "$FRONTEND_DIR" -maxdepth 1 -type f -name "*-*_*" ! -name "package*" 2>/dev/null | sed 's/^/    /'
fi

echo ""

if [ "$ERRORS" -eq 0 ]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Cleanup Complete!${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}Frontend directory structure is now clean:${NC}"
    echo -e "  ${BLUE}/home/nick/ai-video-editor/frontend/${NC}"
    echo -e "    ├── src/           ${YELLOW}← Main source code${NC}"
    echo -e "    ├── node_modules/"
    echo -e "    ├── .next/"
    echo -e "    ├── package.json"
    echo -e "    └── tsconfig.json"
    echo ""
    echo -e "${GREEN}🚀 Next steps:${NC}"
    echo -e "  1. Test frontend: ${BLUE}cd frontend && npm run dev${NC}"
    echo -e "  2. Or run full stack: ${BLUE}./scripts/dev_all.sh${NC}"
    echo ""
else
    echo -e "${RED}❌ Cleanup completed but found $ERRORS errors!${NC}"
    echo -e "${YELLOW}Please check the output above.${NC}"
    exit 1
fi
