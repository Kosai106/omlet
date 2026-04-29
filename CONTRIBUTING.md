# Contributing to Omlet

First off, thank you for taking the time to contribute! Omlet is an open-source project, and we truly appreciate the community's help in improving component analytics for React and React Native.

All types of contributions are encouraged and valued. See the Table of Contents for different ways to help and details about how this project handles them.

## Table of Contents

- [I Have a Question](#i-have-a-question)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)

## I Have a Question

Before you open an issue, please search the existing [Issues](https://github.com/zeplin/omlet/issues) and the [Documentation](./docs/README.md) to see if your question has already been answered.

## Reporting Bugs

When filing an issue, please ensure the report is as comprehensive as possible:
- **Use a clear and descriptive title.**
- **Describe the exact steps to reproduce the problem.**
- **Describe the behavior you observed and what you expected to see.**
- **Include screenshots or logs** if applicable.
- **Environment details:** Node.js version, OS, and which part of Omlet (CLI or Webapp) is affected.

## Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please:
- Use a clear and descriptive title.
- Provide a step-by-step description of the suggested enhancement.
- Explain why this enhancement would be useful to most Omlet users.

## Development Setup

### Prerequisites
- **Node.js**: v20 or higher is required.
- **Docker**: Required for running MongoDB and Redis locally.
- **Rust**: Required if you are contributing to the CLI core.

### Webapp Setup
1. Navigate to the webapp directory: `cd webapp`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

The app will be accessible at `http://localhost:3001`.

### CLI Setup
The CLI is located in the `cli/` directory. It uses Rust with Node bindings. To run the CLI from source against your local webapp:
1. Navigate to the cli directory: `cd cli`
2. Install dependencies: `npm install`
3. Build the CLI: ` npm run build:dev`
4. Run the CLI: `OMLET_BASE_URL=http://localhost:3001 ./bin/omlet [login|init|analyze]`

## Pull Request Process

1. **Fork the repo** and create your branch from `main`.
2. **Follow the code style** of the project (ESLint and Prettier are used throughout).
3. **Ensure tests pass**: Run any existing test suites before submitting.
4. **Update documentation**: If you're adding a feature or changing behavior, update the relevant files in `docs/`.
5. **Draft your PR**: Provide a clear description of the changes and link to any relevant issues.

## Style Guidelines

- **TypeScript**: We use strict TypeScript. Ensure your changes are type-safe.
- **Linting**: Run `npm run lint` in the respective directories to ensure code quality.
- **Commits**: Use descriptive commit messages. We recommend the Conventional Commits specification.

Thank you for contributing to Omlet!
