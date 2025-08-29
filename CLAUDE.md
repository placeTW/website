# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- **Development Server**: `npm run dev` - Starts the Vite development server
- **Build**: `npm run build` - Runs TypeScript compiler and builds the project with Vite
- **TypeCheck**: `npm run tsc` - Runs TypeScript compiler to check for type errors
- **Lint**: `npm run lint` - Runs ESLint on TypeScript and TSX files
- **Preview**: `npm run preview` - Previews the built application
- **Translations**: `npm run translations` - Runs i18next parser to extract translations

## Testing

- **Running Tests**: The project uses Python for testing JSON files
  - Tests can be run with a Python test runner like pytest: `pytest tests/`

## Architecture Overview

This is a React + TypeScript + Vite project for the Taiwan's r/place community website. The architecture includes:

### Frontend Framework

- React 18 with TypeScript
- Chakra UI for component styling
- React Router for navigation
- Framer Motion for animations
- Konva/React-Konva for canvas interactions

### Backend Services

- Firebase for hosting and Firestore database
- Supabase for authentication, storage, and database functions

### Internationalization

- i18next for translation management
- Multiple languages supported (English, Chinese, Lithuanian, Estonian, etc.)
- Translation files stored in `public/locales/{language_code}/translation.json`

### Key Directories

- `src/` - Main source code
  - `api/` - API integration code, including Supabase client
  - `component/` - React components organized by feature
  - `context/` - React context providers
  - `pages/` - Page components for different routes
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions
- `public/` - Static assets and localization files
  - `locales/` - Translation JSON files by language
- `i18n/` - Internationalization utilities
- `tests/` - Python tests for verifying JSON files

### Workflows

- The codebase includes art tool features for canvas creation and design management
- Translation management is a key feature with a dedicated interface
- Authentication flow is handled via Supabase

## Environment Variables

The project requires several environment variables:

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_CODE_SERVER` - Optional flag for code-server configuration