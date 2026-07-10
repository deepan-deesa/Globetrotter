# Git Setup Instructions

## Push to GitHub (Root Level)

Since your project is in `Stack-Starter` folder but you want files at repo root:

### Option 1: Move files then push (Recommended)

```bash
# Navigate to Desktop
cd C:\Users\user\Desktop

# Create temp folder
mkdir temp-globetrotter
cd temp-globetrotter

# Initialize git
git init

# Add remote
git remote add origin https://github.com/Sanjay767676/Odoo-SNS-Hackathon-Team404.git

# Copy all files from Stack-Starter to current directory
xcopy /E /I /Y ..\Stack-Starter\* .

# Remove .env (sensitive data)
del .env

# Add all files
git add .

# Commit
git commit -m "Initial commit: GlobeTrotter travel planning app"

# Push to main branch
git branch -M main
git push -u origin main --force
```

### Option 2: Direct from Stack-Starter

```bash
# Navigate to Stack-Starter
cd C:\Users\user\Desktop\Stack-Starter

# Initialize git
git init

# Add remote
git remote add origin https://github.com/Sanjay767676/Odoo-SNS-Hackathon-Team404.git

# Remove .env from tracking
echo .env >> .gitignore

# Add all files
git add .

# Commit
git commit -m "Initial commit: GlobeTrotter travel planning app"

# Push
git branch -M main
git push -u origin main --force
```

## Important Notes

1. **Never commit .env** - It contains sensitive database credentials
2. The `.gitignore` already excludes `.env`
3. Use `--force` only if repo is empty or you want to overwrite
4. Update README.md with your team info

## After Pushing

Update `.env.example` with placeholder values:
```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PORT=5000
```
