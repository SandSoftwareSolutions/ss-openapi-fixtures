import { faker } from "@faker-js/faker";
import SwaggerParser from "@apidevtools/swagger-parser";

function resolve(schema, document) {
  if (!schema?.$ref) return schema ?? {};
  if (!schema.$ref.startsWith("#/")) throw new Error(`Only local references are supported: ${schema.$ref}`);
  return schema.$ref.slice(2).split("/").reduce((value, segment) => value?.[segment.replaceAll("~1", "/").replaceAll("~0", "~")], document);
}

function formattedValue(format) {
  switch (format) {
    case "email": return faker.internet.email();
    case "uuid": return faker.string.uuid();
    case "date-time": return faker.date.recent({ days: 30 }).toISOString();
    case "date": return faker.date.recent({ days: 30 }).toISOString().slice(0, 10);
    case "uri": return faker.internet.url();
    case "ipv4": return faker.internet.ipv4();
    case "phone": return faker.phone.number();
    default: return undefined;
  }
}

export function createFixture(schema, { document = {}, seed, maxArrayLength = 3 } = {}) {
  if (seed !== undefined) faker.seed(seed);
  if (!Number.isSafeInteger(maxArrayLength) || maxArrayLength < 1) throw new TypeError("maxArrayLength must be a positive integer");
  const make = (input) => {
    const current = resolve(input, document);
    if (current.example !== undefined) return current.example;
    if (current.default !== undefined) return current.default;
    if (current.enum?.length) return faker.helpers.arrayElement(current.enum);
    const format = formattedValue(current.format);
    if (format !== undefined) return format;
    if (current.type === "array") return Array.from({ length: current.minItems ?? faker.number.int({ min: 1, max: maxArrayLength }) }, () => make(current.items));
    if (current.type === "object" || current.properties) {
      const result = {};
      for (const [key, property] of Object.entries(current.properties ?? {})) result[key] = make(property);
      return result;
    }
    if (current.type === "integer" || current.type === "number") return faker.number.int({ min: current.minimum ?? 1, max: current.maximum ?? 10_000 });
    if (current.type === "boolean") return faker.datatype.boolean();
    return faker.lorem.words({ min: current.minLength ? Math.max(1, Math.ceil(current.minLength / 5)) : 1, max: 4 });
  };
  return make(schema);
}

export function createOpenApiFixtures(document, options = {}) {
  if (!document || typeof document !== "object") throw new TypeError("document must be an OpenAPI or Swagger object");
  const operations = Object.values(document.paths ?? {}).flatMap((path) => Object.values(path ?? {})).filter((operation) => operation && typeof operation === "object");
  return {
    byOperation(operationId, { status = "200", ...fixtureOptions } = {}) {
      const operation = operations.find((item) => item.operationId === operationId);
      if (!operation) throw new Error(`Operation not found: ${operationId}`);
      const response = operation.responses?.[String(status)] ?? operation.responses?.default;
      if (!response) throw new Error(`Response ${status} not found for ${operationId}`);
      const schema = response.content?.["application/json"]?.schema ?? response.schema;
      if (!schema) throw new Error(`No JSON schema found for ${operationId} response ${status}`);
      return createFixture(schema, { document, ...options, ...fixtureOptions });
    },
    fromSchema(schema, fixtureOptions = {}) { return createFixture(schema, { document, ...options, ...fixtureOptions }); }
  };
}

/**
 * Bundle local and remote $ref values into a document that the synchronous
 * fixture API can consume. The returned document keeps references where
 * possible, avoiding the circular object graphs produced by full dereferencing.
 */
export async function loadOpenApiDocument(input) {
  if (!input || typeof input !== "string" && typeof input !== "object") throw new TypeError("input must be a document, file path, or URL");
  return SwaggerParser.bundle(input);
}

/** Load an OpenAPI/Swagger input, then create fixtures from its operations. */
export async function createOpenApiFixturesFrom(input, options = {}) {
  const document = await loadOpenApiDocument(input);
  return createOpenApiFixtures(document, options);
}
