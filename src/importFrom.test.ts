import { describe, expect, it, vi } from "vitest";

import { importFrom } from "./importFrom.js";

const mockEnhancedResolved = vi.fn<typeof import("enhanced-resolve")>();

vi.mock("enhanced-resolve", () => ({
	get default() {
		return mockEnhancedResolved;
	},
}));

const directory = "./example";
const packageName = "my-package";

describe("importFrom", () => {
	it("returns the error when enhancedResolve provides an error", async () => {
		const error = new Error();
		const importer = vi.fn();

		mockEnhancedResolved.mockImplementationOnce(
			(_directory, _packageName, resolve) => {
				resolve(error);
			},
		);

		const actual = await importFrom(directory, packageName, importer);

		expect(actual).toBe(error);
		expect(importer).not.toHaveBeenCalled();
	});

	it("returns the result when enhancedResolve provides a main that can be imported", async () => {
		const expected = { happy: true };
		const importer = vi.fn().mockResolvedValueOnce(expected);
		const main = "./example/my-package/lib/index.js";

		mockEnhancedResolved.mockImplementationOnce(
			(_directory, _packageName, resolve) => {
				resolve(null, main);
			},
		);

		const actual = await importFrom(directory, packageName, importer);

		expect(actual).toBe(expected);
		expect(importer).toHaveBeenCalledWith(main);
	});

	it("returns the error when enhancedResolve provides a main that rejects when imported", async () => {
		const error = new Error("Oh no!");
		const importer = vi.fn().mockRejectedValueOnce(error);
		const main = "./example/my-package/lib/index.js";

		mockEnhancedResolved.mockImplementationOnce(
			(_directory, _packageName, resolve) => {
				resolve(null, main);
			},
		);

		const actual = await importFrom(directory, packageName, importer);

		expect(actual).toBe(error);
		expect(importer).toHaveBeenCalledWith(main);
	});
});
