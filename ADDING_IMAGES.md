# How to Add New Images

This guide explains how to add new AI-generated images to the voting application.

## 1. Prepare Your Data
The application expects a specific folder structure in the `images` directory (located at the root of the project workspace, parallel to `image-voting-app`).

### Folder Structure
```
images/
  └── [slug_name]/                  <-- Unique folder name for the prompt (e.g., "futuristic_city")
      ├── _prompt.txt               <-- Text file containing the prompt description
      ├── Midjourney/               <-- Folder for Model A
      │   └── image1.png
      ├── DALL-E-3/                 <-- Folder for Model B
      │   └── image2.png
      ├── Flux/                     <-- Folder for Model C
      │   └── image3.png
      └── ...
```

### Requirements
1.  **Slug Folder**: Create a folder with a unique name (slug) for your prompt. Use lowercase and underscores (e.g., `modern_living_room`).
2.  **Prompt File**: Inside the slug folder, create a file named `_prompt.txt`. Paste the full text of the prompt into this file.
3.  **Model Folders**: Create subfolders for each AI model (e.g., `Midjourney`, `ChatGPT`, `Flux`). The folder name will be used as the model name.
4.  **Images**: Place the generated image(s) inside the corresponding model folder. Supported formats: `.png`, `.jpg`, `.jpeg`, `.webp`.

## 2. Run the Ingestion Script
Once your folders are set up, run the ingestion script to process the images, generate translations, and update the database.

Open your terminal in the `image-voting-app` directory and run:

```bash
npx tsx scripts/ingest.ts
```

### What the script does:
-   **Scans** the `images` directory for new folders.
-   **Reads** the `_prompt.txt` file.
-   **Translates** the prompt to Spanish automatically (using Google Translate).
-   **Copies** images to the public web folder (`public/images`).
-   **Updates** the database with the new prompt, translations, and image paths.

## 3. Verify
Start the application (if not already running):
```bash
npm run dev
```
Visit `http://localhost:3000` and refresh a few times. Your new prompt and images should appear in the rotation!

## Troubleshooting
-   **Duplicate Slugs**: If you use a slug that already exists, the script will update the existing entry.
-   **Missing Prompt**: If `_prompt.txt` is missing, the folder will be skipped.
-   **Translation Errors**: If translation fails, it will default to the English text (you can manually edit it in the database later).
