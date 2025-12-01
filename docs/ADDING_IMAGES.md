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
5.  **Minimum Quantity**: You must have at least **4 different models** (and thus 4 images) for the voting to work correctly.

## 2. Run the Sync Script
Once your folders are set up, run the **sync script**. This single command will:
1.  Ingest new images and prompts.
2.  Automatically translate prompts using OpenAI (if configured).

```bash
npm run sync
```

### What this does:
-   **Scans** the `images` directory.
-   **Updates** the database.
-   **Translates** everything to Spanish using OpenAI (requires `OPENAI_API_KEY`).

> **Note**: If you don't have an OpenAI key, it will skip the high-quality translation step and stick with the basic one.

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
