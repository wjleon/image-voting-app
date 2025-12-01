import { execSync } from 'child_process';

console.log('🔄 Starting full sync process...');

try {
    // 1. Ingest Images & Prompts
    console.log('\n📦 Step 1: Ingesting images and prompts...');
    // We use npx tsx to run the other typescript scripts
    execSync('npx tsx scripts/ingest.ts', { stdio: 'inherit' });

    // 2. Translate with OpenAI
    console.log('\n🌐 Step 2: Generating high-quality translations (OpenAI)...');
    execSync('npx tsx scripts/translate-openai.ts', { stdio: 'inherit' });

    console.log('\n✨ All done! Your new images and translations are live.');
    console.log('   Run "npm run dev" to test locally.');

} catch (error) {
    console.error('\n❌ Error during sync process.');
    // The child process will have already printed its error to stderr due to stdio: 'inherit'
    process.exit(1);
}
