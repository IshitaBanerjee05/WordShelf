# ╔══════════════════════════════════════════════════════════════╗
# ║         WORDSHELF — PHASE 0 COMPLETE SETUP GUIDE            ║
# ║         Run everything in this exact order                  ║
# ╚══════════════════════════════════════════════════════════════╝

# ─────────────────────────────────────────
# STEP 1 — VERIFY PREREQUISITES
# Run these first. If any fail, install them.
# ─────────────────────────────────────────

node --version        # Need v18+ 
npm --version         # Need v9+
python --version      # Need v3.11+
git --version         # Need any recent version
code --version        # VS Code CLI

# ─────────────────────────────────────────
# STEP 2 — CREATE ROOT PROJECT FOLDER
# ─────────────────────────────────────────

mkdir wordshelf
cd wordshelf
git init
echo "# WordShelf" > README.md


# ══════════════════════════════════════════
#  FRONTEND SETUP (React)
# ══════════════════════════════════════════

# STEP 3 — Create React App
npm create vite@latest frontend -- --template react
cd frontend

# STEP 4 — Install ALL dependencies at once
npm install

npm install \
  react-router-dom \
  axios \
  recharts \
  framer-motion \
  react-hook-form \
  react-calendar-heatmap \
  react-tooltip

# Dev dependencies
npm install -D \
  tailwindcss \
  postcss \
  autoprefixer \
  @types/react \
  @types/react-dom

# STEP 5 — Init Tailwind
npx tailwindcss init -p

# STEP 6 — Open in VS Code
cd ..
code .