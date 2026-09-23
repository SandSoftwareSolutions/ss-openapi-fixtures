# @sandsoftwaresolutions/openapi-fixtures

Turn OpenAPI 3 and Swagger 2 response schemas into realistic API fixtures. It uses Faker for data such as emails, UUIDs, dates and URLs, resolves local `$ref`s, honours examples/enums, and can seed results for reliable tests.

```js
import spec from "./openapi.json" with { type: "json" };
import { createOpenApiFixtures } from "@sandsoftwaresolutions/openapi-fixtures";

const fixtures = createOpenApiFixtures(spec, { seed: 42 });
const user = fixtures.byOperation("getUser");
const validationError = fixtures.byOperation("createUser", { status: 422 });
```

Use this in unit tests, contract tests, Storybook/MSW handlers, or to seed a local development database. It accepts an already-parsed JSON/YAML OpenAPI object; parse YAML with your preferred YAML parser before passing it in.
