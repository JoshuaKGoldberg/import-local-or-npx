import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { importLocalOrNpx, ModuleImporter } from "./importLocalOrNpx.js";

const mockNpxImport = vi.fn();

vi.mock("npx-import", () => ({
	get npxImport() {
		return mockNpxImport;
	},
}));

const mockImportFrom = vi.fn();

vi.mock("./importFrom.js", () => ({
	get importFrom() {
		return mockImportFrom;
	},
}));

describe("importLocalOrNpx", () => {
	it("returns a local import when importFrom resolves with a module with the default importer", async () => {
		const specifier = "./package.json";

		mockImportFrom.mockImplementationOnce(
			async (
				directory: string,
				packageName: string,
				importer: ModuleImporter,
			) => (await importer(path.join(directory, packageName))) as unknown,
		);

		const actual = await importLocalOrNpx(specifier);

		expect(actual).toEqual({
			kind: "local",
			resolved: await import("../package.json"),
		});
		expect(mockNpxImport).not.toHaveBeenCalled();
	});

	it("returns a local import when importFrom resolves with a module with an importer", async () => {
		const importer = vi.fn();
		const specifier = "./relative";
		const expected = { happy: true };

		mockImportFrom.mockResolvedValueOnce(expected);

		const actual = await importLocalOrNpx(specifier, { importer });

		expect(actual).toEqual({
			kind: "local",
			resolved: expected,
		});
		expect(mockNpxImport).not.toHaveBeenCalled();
	});

	it("returns an import when importFrom resolves with an error and npxImport resolves with a module", async () => {
		const importer = vi.fn();
		const specifier = "./relative";
		const expected = { happy: true };

		mockImportFrom.mockResolvedValueOnce(new Error("Oh no!"));
		mockNpxImport.mockResolvedValueOnce(expected);

		const actual = await importLocalOrNpx(specifier, { importer });

		expect(actual).toEqual({
			kind: "npx",
			resolved: expected,
		});
	});

	it("returns a failure when importFrom resolves with an error and npxImport rejects", async () => {
		const importer = vi.fn();
		const specifier = "./relative";
		const importedLocal = new Error("Failure: local");
		const importedNpx = new Error("Failure: npx");

		mockImportFrom.mockResolvedValueOnce(importedLocal);
		mockNpxImport.mockRejectedValueOnce(importedNpx);

		const actual = await importLocalOrNpx(specifier, { importer });

		expect(actual).toEqual({
			kind: "failure",
			local: importedLocal,
			npx: importedNpx,
		});
	});
});
