# @sandsoftwaresolutions/openapi-fixtures

[![CI](https://github.com/SandSoftwareSolutions/ss-openapi-fixtures/actions/workflows/ci.yml/badge.svg)](https://github.com/SandSoftwareSolutions/ss-openapi-fixtures/actions/workflows/ci.yml)

Generate realistic, reproducible API test data directly from OpenAPI 3 or Swagger 2 schemas. Faker powers e-mails, UUIDs, dates, URLs and more; examples, defaults, enums, arrays and local `$ref`s are respected.

## Install

```bash
npm install @sandsoftwaresolutions/openapi-fixtures
```

## Generate fixtures from operations

```js
import spec from "./openapi.json" with { type: "json" };
import { createOpenApiFixtures } from "@sandsoftwaresolutions/openapi-fixtures";

const fixtures = createOpenApiFixtures(spec, { seed: 42 });
const user = fixtures.byOperation("getUser");
const validationError = fixtures.byOperation("createUser", { status: 422 });
```

The same seed gives the same fixtures, which keeps snapshots and tests stable. `byOperation(operationId, { status })` reads an OpenAPI response by its operation ID. `fromSchema(schema)` generates a fixture from any individual JSON schema.

## Common uses

- Seed a local database with convincing development data.
- Return contract-accurate mock responses from MSW or Storybook.
- Exercise frontend loading, error and empty states without a live API.

Pass an already-parsed JSON or YAML object; choose your own YAML parser when the source specification is YAML. External `$ref`s are intentionally not fetched.
