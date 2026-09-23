import assert from "node:assert/strict";
import test from "node:test";
import { createFixture, createOpenApiFixtures } from "./src/index.js";
const document = { components: { schemas: { User: { type: "object", properties: { id: { type: "string", format: "uuid" }, email: { type: "string", format: "email" }, role: { type: "string", enum: ["admin", "member"] } } } } }, paths: { "/users/{id}": { get: { operationId: "getUser", responses: { 200: { content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } } } } } } };
test("creates realistic data from a referenced OpenAPI response", () => {
  const fixture = createOpenApiFixtures(document).byOperation("getUser", { seed: 42 });
  assert.match(fixture.id, /^[0-9a-f-]{36}$/i); assert.match(fixture.email, /@/); assert.ok(["admin", "member"].includes(fixture.role));
});
test("is reproducible when seeded", () => {
  const schema = { type: "array", minItems: 2, items: { type: "integer", minimum: 10, maximum: 20 } };
  assert.deepEqual(createFixture(schema, { seed: 7 }), createFixture(schema, { seed: 7 }));
});
test("supports Swagger v2 response schemas", () => assert.equal(typeof createOpenApiFixtures({ paths: { "/health": { get: { operationId: "health", responses: { 200: { schema: { type: "boolean" } } } } } } }).byOperation("health", { seed: 1 }), "boolean"));
