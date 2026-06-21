# Fleet management (DDD + CQRS)

Vehicle fleet parking management exercise — Step 1: in-memory domain with BDD tests.

## Requirements

- Node.js 18+
- npm or yarn

## Install

```shell
npm install
```

## Run tests

```shell
npm test              # all scenarios
npm run test:critical # @critical scenarios only
```

## Project layout

```shell
src/
  App/     # Commands, queries and handlers
  Domain/  # Entities, value objects, domain services
  Infra/   # Repository implementations (in-memory for Step 1)
features/
  *.feature
  step_definitions/
  support/
```
