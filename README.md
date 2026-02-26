# Payroll App

Software for managing attendances, expenses, advances, salaries, and workers.

## Features
- Windows Installer (NSIS)
- Automatic Updates via GitHub Releases
- Multi-component architecture (Electron + Vite + NestJS + Prisma)

## Deployment & Updates

This project uses **GitHub Actions** to automatically build and release the application.

### 1. Initial Setup
1. Create a GitHub Personal Access Token (`GH_TOKEN`) with `repo` scope.
2. Add it as a **Secret** in your GitHub repository: `Settings > Secrets and variables > Actions > New repository secret`.

### 2. How to Release a New Version
1. Update the version in `package.json`:
   ```bash
   npm version patch
   ```
2. Push the code and tags to GitHub:
   ```bash
   git push origin main --tags
   ```
3. GitHub Actions will automatically build the Windows installer and create a draft release on GitHub.

### 3. Automatic Updates
The application includes `electron-updater`. When a new version is published on GitHub, the app will:
- Check for updates on startup.
- Download the new version in the background.
- Install the update when the app is restarted.
