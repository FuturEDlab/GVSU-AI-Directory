# LakerAI Directory Testing System

This directory contains the testing architecture for the LakerAI Directory project.

## Directory Structure

```
tests/
├── unit/           # Functions, hooks, validation, scoring, regression tests
├── component/      # Component logic, props, fallback behaviors, filters
├── integration/    # Admin Portal, Governance Hub tabs, Firebase workflow integration
├── e2e/            # End-to-end user journeys (Homepage, LakerAI, Prompts, Admin)
├── performance/    # Execution speed, render pass, memoization, catalog benchmarks
├── fixtures/       # Mock data objects for tools, prompts, reports
├── mocks/          # Mock Firebase & snapshot store implementations
└── utils/          # Measurement and assertion utilities
```

## Running Tests

Run all test suites:
```bash
npm run test
```

Run specific test categories:
```bash
npm run test:unit          # Unit tests & Firebase hook regression tests
npm run test:component     # Component logic tests
npm run test:integration   # Admin Portal & Governance Hub tab tests
npm run test:e2e           # End-to-end workflow tests
npm run test:performance   # Benchmark performance tests
```

## Development Testing Dashboard (`/testing`)

An internal testing dashboard is available at `/testing`.
- **Environment Rule**: Only accessible in development mode (`NODE_ENV === 'development'`) or by signed-in Administrators.
- **On-Demand Execution**: Tests do NOT run automatically on page load to prevent unintended network/Firestore traffic. Click **Run All Test Suites** or run individual category buttons.

## Local & Firebase Safety Guidelines

- **Deterministic Unit & Component Tests**: Mock data and snapshot mocks are used for automated testing.
- **Production Safety**: Destructive automated tests must **NEVER** run against production Firestore.
- **Secrets & Credentials**: API keys, Firebase credentials, and private user data must never be exposed or committed in test output.
