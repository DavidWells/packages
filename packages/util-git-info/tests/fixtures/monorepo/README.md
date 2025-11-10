# Serverless Monorepo Test Fixture

This directory contains a sample monorepo structure with multiple serverless services for testing the serverless-monorepo-detection example.

## Structure

```
monorepo/
├── service-api/          # REST API service
│   ├── serverless.yml    # YAML configuration with HTTP endpoints
│   └── package.json
├── service-worker/       # Background worker service
│   ├── serverless.yml    # YAML configuration with SQS and scheduled functions
│   └── package.json
└── service-frontend/     # Frontend rendering service
    ├── serverless.js     # JavaScript configuration
    └── package.json
```

## Services

### service-api
- **Config Format**: YAML
- **Functions**: 5 (getUsers, createUser, updateUser, deleteUser, authenticateUser)
- **Handler Pattern**: `src/handlers/*.{method}`
- **Events**: HTTP API endpoints

### service-worker
- **Config Format**: YAML
- **Functions**: 4 (processJob, scheduleJob, sendNotification, cleanupOldRecords)
- **Handler Pattern**: `handlers/*.*`
- **Events**: SQS, SNS, scheduled (cron)

### service-frontend
- **Config Format**: JavaScript
- **Functions**: 3 (renderPage, generateSitemap, optimizeImages)
- **Handler Pattern**: `lib/*.*`
- **Events**: HTTP proxy, scheduled, S3 events

## Usage

This fixture is designed to test the `serverless-monorepo-detection.js` example, which:
- Finds all serverless projects in a monorepo
- Detects changes to each service
- Extracts function handlers from different config formats
- Identifies which functions have been modified
