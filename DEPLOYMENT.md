# How to Deploy to Vercel (Dumb-Proof Guide)

This guide will walk you through deploying this app to Vercel.

> **⚠️ IMPORTANT**: This app currently uses **SQLite**, which **does not work** on Vercel (because Vercel is serverless and the database file would be erased constantly).
>
> To deploy successfully, we must switch the database to **Vercel Postgres**. This guide includes those steps.

---

## Phase 1: Prepare Vercel Project

1.  **Go to Vercel**: Log in to [vercel.com](https://vercel.com).
2.  **Add Project**: Click **"Add New..."** > **"Project"**.
3.  **Import Git Repository**: Select your GitHub repository for this app.
4.  **Environment Variables**:
    *   Skip this for now. Click **"Deploy"**.
    *   *Note: The deployment will likely fail or be broken because of the database. Ignore it for a moment.*

## Phase 2: Set Up the Database (Postgres)

1.  **Go to Storage**: In your new Vercel project dashboard, click the **"Storage"** tab.
2.  **Create Database**:
    *   Click **"Connect Store"**.
    *   Select **"Postgres"**.
    *   Click **"Continue"**.
    *   Accept the terms and click **"Create"**.
    *   Give it a name (e.g., `image-voting-db`) and select a region (e.g., `Washington, D.C. - iad1`).
    *   Click **"Create"**.
3.  **Get Credentials**:
    *   Once created, go to the **".env.local"** tab in the database page.
    *   Click **"Show Secret"**.
    *   Copy the value of `POSTGRES_PRISMA_URL`.
4.  **Add Environment Variable**:
    *   Go to your project **"Settings"** > **"Environment Variables"**.
    *   Add a new variable:
        *   **Key**: `DATABASE_URL`
        *   **Value**: (Paste the `POSTGRES_PRISMA_URL` you copied).
    *   Click **"Save"**.

## Phase 3: Update Code for Postgres

You need to make two small changes to your code to make it compatible with Postgres.

1.  **Update `prisma/schema.prisma`**:
    Open the file and change the datasource provider from `"sqlite"` to `"postgresql"`.
    ```prisma
    datasource db {
      provider = "postgresql" // Changed from "sqlite"
      url      = env("DATABASE_URL")
    }
    ```

2.  **Update `package.json`**:
    Update the `build` script to ensure the database schema is updated during deployment.
    ```json
    "scripts": {
      "build": "prisma db push && next build",
      // ... other scripts
    }
    ```

3.  **Push Changes**:
    Commit and push these changes to GitHub. Vercel will detect the push and start a new deployment. This one should succeed!

## Phase 4: Upload Your Data (Prompts & Images)

Your production database is currently empty. You need to run the ingestion script from your computer, but point it to the Vercel database.

1.  **Get Connection String**:
    *   Go back to Vercel > Storage > Your Database > `.env.local`.
    *   Copy the `POSTGRES_PRISMA_URL`.
2.  **Update Local Config**:
    *   Open your local `.env` file.
    *   Replace the `DATABASE_URL` with the Vercel URL you just copied.
3.  **Run Ingestion**:
    *   Run the script in your terminal:
        ```bash
        npx tsx scripts/ingest.ts
        ```
    *   This will read your local `images/` folder and upload the data (prompts, translations, image paths) to the Vercel database.
    *   *Note: The actual image files are deployed with your code to Vercel, so the paths will work.*

## Phase 5: Verify

Visit your Vercel domain (e.g., `https://image-voting-app.vercel.app`).
-   You should see the voting interface.
-   Try voting.
-   Check `/admin` to see if votes are recording.

**🎉 You are live!**
