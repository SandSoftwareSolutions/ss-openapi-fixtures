export interface FixtureOptions { document?: object; seed?: number; maxArrayLength?: number; }
export declare function createFixture<T = unknown>(schema: object, options?: FixtureOptions): T;
export interface OpenApiFixtures { byOperation<T = unknown>(operationId: string, options?: Omit<FixtureOptions, "document"> & { status?: string | number }): T; fromSchema<T = unknown>(schema: object, options?: Omit<FixtureOptions, "document">): T; }
export declare function createOpenApiFixtures(document: object, options?: Omit<FixtureOptions, "document">): OpenApiFixtures;
export declare function loadOpenApiDocument(input: object | string): Promise<object>;
export declare function createOpenApiFixturesFrom(input: object | string, options?: Omit<FixtureOptions, "document">): Promise<OpenApiFixtures>;
