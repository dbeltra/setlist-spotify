# Setlist to Spotify Playlist

Serverless application to create Spotify playlists from setlist.fm average setlists.

## Project Structure

```
.
├── src/                    # Core application logic
├── netlify/functions/      # Netlify serverless function endpoints
├── tests/
│   ├── unit/              # Unit tests
│   └── properties/        # Property-based tests
├── tsconfig.json          # TypeScript configuration
├── vitest.config.ts       # Vitest test configuration
└── package.json           # Project dependencies and scripts
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables (see `.env.example`)

3. Build the project:
   ```bash
   npm run build
   ```

## Testing

- Run all tests: `npm test`
- Run tests in watch mode: `npm run test:watch`
- Run tests with coverage: `npm run test:coverage`

## Deployment

Deploy to Netlify using the Netlify CLI or by connecting your Git repository.
