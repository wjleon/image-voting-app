import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const SOURCE_DIR = path.resolve(__dirname, '../../images'); // Adjust if needed
const PUBLIC_IMAGES_DIR = path.resolve(__dirname, '../public/images');

// Model name normalization map
const MODEL_MAP: Record<string, string> = {
  'Nano Banana Pro': 'NanoBananaPro',
  // Add others if strict normalization is needed, otherwise we use the folder name
};

function normalizeModelName(name: string): string {
  return MODEL_MAP[name] || name;
}

function sanitizeSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

async function main() {
  console.log('Starting ingestion...');

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const challengeFolders = fs.readdirSync(SOURCE_DIR).filter(f => {
    return fs.statSync(path.join(SOURCE_DIR, f)).isDirectory() && !f.startsWith('.');
  });

  console.log(`Found ${challengeFolders.length} challenge folders.`);

  for (const folder of challengeFolders) {
    const folderPath = path.join(SOURCE_DIR, folder);
    const promptFilePath = path.join(folderPath, '_prompt.txt');

    if (!fs.existsSync(promptFilePath)) {
      console.warn(`Skipping ${folder}: _prompt.txt not found.`);
      continue;
    }

    const promptText = fs.readFileSync(promptFilePath, 'utf-8').trim();
    const slug = sanitizeSlug(folder);

    // Create or update Prompt
    const prompt = await prisma.prompt.upsert({
      where: { slug },
      update: { text: promptText },
      create: {
        slug,
        text: promptText,
      },
    });

    // Create Translations
    // English (Source)
    await prisma.promptTranslation.upsert({
      where: {
        promptId_language: {
          promptId: prompt.id,
          language: 'en',
        },
      },
      update: { text: promptText },
      create: {
        promptId: prompt.id,
        language: 'en',
        text: promptText,
      },
    });

    // Spanish Translation
    let spanishText = `[ES] ${promptText}`;
    try {
      // Dynamic import for ESM module
      const { translate } = await import('@vitalets/google-translate-api');
      const res = await translate(promptText, { to: 'es' });
      spanishText = res.text;
    } catch (error) {
      console.warn(`Translation failed for ${slug}:`, error);
      // Fallback to mock if translation fails
    }

    await prisma.promptTranslation.upsert({
      where: {
        promptId_language: {
          promptId: prompt.id,
          language: 'es',
        },
      },
      update: { text: spanishText },
      create: {
        promptId: prompt.id,
        language: 'es',
        text: spanishText,
      },
    });

    console.log(`Processed Prompt: ${slug} (with EN/ES translations)`);

    // Process Model Subfolders
    const modelFolders = fs.readdirSync(folderPath).filter(f => {
      return fs.statSync(path.join(folderPath, f)).isDirectory() && !f.startsWith('.');
    });

    for (const modelFolder of modelFolders) {
      const modelPath = path.join(folderPath, modelFolder);
      const normalizedModelName = normalizeModelName(modelFolder);

      // Target directory in public/images
      const targetDir = path.join(PUBLIC_IMAGES_DIR, slug, normalizedModelName);
      fs.mkdirSync(targetDir, { recursive: true });

      const images = fs.readdirSync(modelPath).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

      for (const [index, imageFile] of images.entries()) {
        const ext = path.extname(imageFile);
        // Standardized filename: <slug>-<model>-<seq>.<ext>
        // Note: PRD says <parent-directory-name>-<model-name>-<seq>.<extension>
        // We'll use the slug for the parent directory name part to be safe and URL friendly
        const newFilename = `${slug}-${normalizedModelName}-${index + 1}${ext}`;
        const targetPath = path.join(targetDir, newFilename);
        const sourcePath = path.join(modelPath, imageFile);

        // Copy file
        fs.copyFileSync(sourcePath, targetPath);

        // Create Image record
        // Image path relative to public
        const publicPath = `/images/${slug}/${normalizedModelName}/${newFilename}`;

        await prisma.image.create({
          data: {
            promptId: prompt.id,
            modelName: normalizedModelName,
            imagePath: publicPath,
            impressionCount: 0,
          },
        });
      }
    }
  }

  console.log('Ingestion complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
