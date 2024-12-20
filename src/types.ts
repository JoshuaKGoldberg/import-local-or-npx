export type Imported = ImportedLocal | ImportedNpx | ImportFailure;

export interface ImportedLocal {
	kind: "local";
	resolved: ModuleNamespaceObject;
}

export interface ImportedNpx {
	kind: "npx";
	resolved: ModuleNamespaceObject;
}

export interface ImportFailure {
	kind: "failure";
	local: Error;
	npx: Error;
}

/** @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import#module_namespace_object */
export type ModuleNamespaceObject = object;
