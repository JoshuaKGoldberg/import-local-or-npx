import { npxImport } from "npx-import";

import { importFrom } from "./importFrom.js";
import { Imported } from "./types.js";

export interface ImportLocalOrNpxSettings {
	confirm?: NpxConfirm;
	importer?: ModuleImporter;
	logger?: NpxImportLogger;
}

export type ModuleImporter = (source: string) => Promise<object>;

export type NpxConfirm = (specifier: string) => Promise<Error | undefined>;

export type NpxImportLogger = (message: string) => void;

export async function importLocalOrNpx(
	specifier: string,
	{
		confirm,
		importer = async (source: string) => (await import(source)) as object,
		logger,
	}: ImportLocalOrNpxSettings = {},
): Promise<Imported> {
	const importedLocal = await importFrom(process.cwd(), specifier, importer);
	if (!(importedLocal instanceof Error)) {
		return {
			kind: "local",
			resolved: importedLocal,
		};
	}

	const cancellation = await confirm?.(specifier);
	if (cancellation) {
		return {
			kind: "failure",
			local: importedLocal,
			npx: cancellation,
		};
	}

	try {
		const importedNpx = await npxImport(specifier, logger);
		return {
			kind: "npx",
			resolved: importedNpx as object,
		};
	} catch (error) {
		return {
			kind: "failure",
			local: importedLocal,
			npx: error as Error,
		};
	}
}
