# Product Requirement Document (PRD): Internationalization (i18n)

## 1. Overview
The goal of this feature is to enable the "AI Image Model Comparison Voting App" to support multiple languages, starting with **English (en)** and **Spanish (es)**. This includes localizing the user interface (UI) and dynamically serving translated content (prompts) from the database.

## 2. Objectives
-   **Expand Reach**: Allow Spanish-speaking users to participate in the voting process.
-   **Seamless Experience**: Automatically detect user locale or allow manual switching without losing context.
-   **Content Accuracy**: Ensure prompts are accurately translated to maintain the integrity of the image generation comparison.

## 3. User Stories
-   **As a User**, I want to view the application in my preferred language (English or Spanish) so that I can understand the interface.
-   **As a User**, I want to see prompts in my selected language so that I can accurately judge the images.
-   **As a User**, I want to easily switch between languages using a toggle in the navigation bar.
-   **As an Admin**, I want to batch translate all existing prompts using a high-quality AI service (OpenAI) to ensure consistency.

## 4. Functional Requirements

### 4.1. Routing and Navigation
-   **URL Structure**: Use path-based routing (e.g., `/en/`, `/es/`).
-   **Middleware**:
    -   Intercept requests to detect the user's preferred language from headers.
    -   Redirect root requests (`/`) to the appropriate localized path (e.g., `/en`).
    -   Persist locale preference via cookies.
-   **Language Switcher**: A UI component in the global navigation bar to toggle between available languages.

### 4.2. UI Localization
-   **Static Text**: All UI labels (buttons, headers, navigation links) must be externalized into JSON message files (`messages/en.json`, `messages/es.json`).
-   **Library**: Use `next-intl` for efficient server and client-side rendering of localized strings.

### 4.3. Content Localization (Prompts)
-   **Database Storage**: Store translations for each prompt.
-   **Dynamic Fetching**: The API must return the prompt text corresponding to the current locale.
-   **Fallback**: If a translation is missing, fallback to the default (English) text.

### 4.4. Translation Workflow
-   **Ingestion**: When new prompts are added via `ingest.ts`, an initial translation attempt should be made.
-   **Batch Translation**: A dedicated script (`translate-openai.ts`) must be available to re-translate or backfill translations using the OpenAI API (GPT-3.5/4) for higher quality.

## 5. Technical Specifications

### 5.1. Database Schema (Prisma)
New model `PromptTranslation` to support one-to-many relationship with `Prompt`.

```prisma
model Prompt {
  id           String   @id @default(uuid())
  // ... other fields
  translations PromptTranslation[]
}

model PromptTranslation {
  id        String   @id @default(uuid())
  promptId  String
  language  String   // 'en', 'es'
  text      String
  prompt    Prompt   @relation(fields: [promptId], references: [id])

  @@unique([promptId, language]) // Ensure one translation per language per prompt
}
```

### 5.2. API Endpoints
-   **`GET /api/prompts/random?locale={locale}`**
    -   Accepts a `locale` query parameter.
    -   Returns the prompt object with the `text` field populated from the `PromptTranslation` table for the requested language.

### 5.3. Scripts
-   **`scripts/ingest.ts`**: Updated to populate `PromptTranslation` table.
-   **`scripts/translate-openai.ts`**:
    -   Connects to OpenAI API.
    -   Iterates through all prompts.
    -   Generates Spanish translations.
    -   Upserts records in `PromptTranslation`.
-   **`scripts/check-translations.ts`**: Utility to verify translation coverage and identify missing/fallback values.

## 6. Verification & Testing
-   **Routing**: Verify `/` redirects to `/en` or `/es`. Verify accessing `/es` loads Spanish content.
-   **UI**: Verify all buttons and labels change text when switching languages.
-   **Content**: Verify the prompt text changes when switching languages.
-   **Admin**: Verify the admin dashboard is accessible and localized (if applicable, though currently English-only for admin is acceptable).
