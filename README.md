# @sandsoftwaresolutions/openapi-fixtures

[![CI](https://github.com/SandSoftwareSolutions/ss-openapi-fixtures/actions/workflows/ci.yml/badge.svg)](https://github.com/SandSoftwareSolutions/ss-openapi-fixtures/actions/workflows/ci.yml)

Generate believable, repeatable API response data directly from an OpenAPI 3 or Swagger 2 document. Instead of maintaining hand-written mock objects that drift from the contract, choose an operation and receive data that follows its documented response schema.

Faker supplies realistic primitives; examples, defaults, enums, arrays, common formats, and local `$ref`s are respected. Bring an already parsed specification and use the result in the test framework, MSW handler, Storybook story, or seed script you already have.

## Install

```bash
npm install @sandsoftwaresolutions/openapi-fixtures
```

Works in Node.js 18+ and any runtime supported by `@faker-js/faker`.

## Use it in Jest

The loader is asynchronous, so load the specification once in a Jest setup or test and reuse the fixture factory:

```js
import { createOpenApiFixturesFrom } from "@sandsoftwaresolutions/openapi-fixtures";
import path from "node:path";

let fixtures;

beforeAll(async () => {
  fixtures = await createOpenApiFixturesFrom(path.resolve("fixtures/openapi.yaml"), { seed: 123 });
});

test("renders a user returned by the documented API", () => {
  expect(fixtures.byOperation("getUser")).toEqual(expect.objectContaining({ email: expect.any(String) }));
});
```

The package does not depend on Jest. The same async factory works with Vitest, Node's test runner, or any other framework that supports promises.

## External `$ref`s and YAML

The synchronous `createOpenApiFixtures(document)` API accepts an object that is already in memory. Use `loadOpenApiDocument(input)` or `createOpenApiFixturesFrom(input)` when the specification is a JSON/YAML file, a URL, or contains references to other files:

```js
const fixtures = await createOpenApiFixturesFrom("./openapi.yaml", { seed: 42 });
const user = fixtures.byOperation("getUser");
```

The loader uses `@apidevtools/swagger-parser` to parse and bundle local or remote references before fixture generation. Bundling keeps references manageable and avoids turning circular schemas into an unserializable fully dereferenced object. External URLs are fetched by the parser, so only load specifications from sources you trust.

The low-level APIs remain synchronous and dependency-light when you already have a parsed document:

```js
const document = { openapi: "3.0.0", info: { title: "Demo", version: "1.0.0" }, paths: {} };
const fixtures = createOpenApiFixtures(document, { seed: 42 });
```

## Quick start

Given a specification containing an operation called `getUser`:

```js
import spec from "./openapi.json" with { type: "json" };
import { createOpenApiFixtures } from "@sandsoftwaresolutions/openapi-fixtures";

const fixtures = createOpenApiFixtures(spec, { seed: 42 });
const user = fixtures.byOperation("getUser");

console.log(user);
// { id: "a1b2…", email: "…@example.net", role: "member" }
```

`seed` is optional, but recommended in tests: the same schema and seed give the same fixture every time.

## Generate from an operation

`byOperation(operationId, options?)` searches all paths in the supplied document, then creates a fixture for one documented response.

```js
const fixtures = createOpenApiFixtures(spec, { seed: 2026 });

const user = fixtures.byOperation("getUser"); // response 200 by default
const invalidInput = fixtures.byOperation("createUser", { status: 422 });
const notFound = fixtures.byOperation("getUser", { status: "404" });
```

For OpenAPI 3, the schema is read from `responses[status].content["application/json"].schema`. For Swagger 2, it is read from `responses[status].schema`. If the requested status is absent, `default` is used. Errors identify the missing operation, response, or JSON schema.

## A complete example

```js
const spec = {
  openapi: "3.1.0",
  paths: {
    "/users/{id}": {
      get: {
        operationId: "getUser",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["admin", "member"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

const fixtures = createOpenApiFixtures(spec, { seed: 42 });
const user = fixtures.byOperation("getUser");
```

This creates an object with a UUID, plausible email address, one documented role, and a recent ISO timestamp.

## Generate from one schema

Use `fromSchema` when the schema is known directly, such as for a unit test or a custom error response.

```js
const fixtures = createOpenApiFixtures(spec, { seed: 7, maxArrayLength: 5 });

const pagination = fixtures.fromSchema({
  type: "object",
  properties: {
    items: { type: "array", minItems: 2, items: { type: "string", format: "email" } },
    nextCursor: { type: "string", example: "cursor_demo" },
  },
});
```

For a standalone schema, call `createFixture(schema, { document, seed, maxArrayLength })` directly. Supply `document` when the schema contains local `$ref`s.

## Schema support

| Schema feature | Fixture result |
| --- | --- |
| `example` | Used exactly as written |
| `default` | Used when there is no example |
| `enum` | One documented value is selected |
| `type: object` / `properties` | An object with a fixture for every property |
| `type: array` / `items` | A generated array; `minItems` is honoured |
| `type: integer` or `number` | An integer within `minimum` and `maximum`, when supplied |
| `type: boolean` | A generated boolean |
| `format: email`, `uuid`, `date-time`, `date`, `uri`, `ipv4`, `phone` | A realistic Faker value |
| Local `$ref`, e.g. `#/components/schemas/User` | Resolved from the supplied document |

Other strings become short placeholder text. For fixed business values, put an `example`, `default`, or `enum` in the schema.

## Use with MSW

```js
import { http, HttpResponse } from "msw";
import { createOpenApiFixtures } from "@sandsoftwaresolutions/openapi-fixtures";
import spec from "../openapi.json" with { type: "json" };

const fixtures = createOpenApiFixtures(spec, { seed: 42 });

export const handlers = [
  http.get("/api/users/:id", () => HttpResponse.json(fixtures.byOperation("getUser"))),
];
```

The response stays structurally aligned with the documented API while remaining deterministic for visual and interaction tests.

## Options

- `seed?: number` resets Faker before generation. Use a fixed value for reliable tests and snapshots.
- `maxArrayLength?: number` is the generated length for arrays without `minItems`; default: `3`.
- `status?: string | number` selects a response for `byOperation`; default: `200`.

Per-call options override options passed to `createOpenApiFixtures`.

## Scope and limitations

This package creates response **data**, not a complete OpenAPI validator or mock server. It does not fetch external `$ref`s, parse YAML itself, generate request parameters, or interpret `oneOf`, `allOf`, and `anyOf`. Parse YAML with your preferred parser before calling it, and combine it with a contract-testing tool when full request/response validation is needed.

Generated fixtures are for development, demos, tests, and local seeding—not production data.
