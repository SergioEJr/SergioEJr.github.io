/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
	/** Umami website ID. Set to enable analytics; leave unset to disable. */
	readonly PUBLIC_UMAMI_WEBSITE_ID?: string;
	/** Umami script URL. Defaults to the Umami Cloud script. */
	readonly PUBLIC_UMAMI_SRC?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// @pagefind/default-ui ships no type declarations; declare the one export we use.
declare module "@pagefind/default-ui" {
	export class PagefindUI {
		constructor(opts: {
			element: string;
			baseUrl?: string;
			bundlePath?: string;
			showImages?: boolean;
			showSubResults?: boolean;
			[key: string]: unknown;
		});
	}
}
