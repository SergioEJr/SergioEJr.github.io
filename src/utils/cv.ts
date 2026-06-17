// Determines whether the CV/resume PDF is actually present, so the download
// button only renders when the file exists. Runs at build time (Node), so it's
// safe to use the filesystem here.
import fs from 'node:fs';
import path from 'node:path';
import { CV_URL } from '../consts';

function resolveCvAvailable(): boolean {
	if (!CV_URL) return false;
	// External URL — assume available.
	if (/^https?:/i.test(CV_URL)) return true;
	const rel = CV_URL.replace(/^\//, '');
	try {
		return fs.existsSync(path.join(process.cwd(), 'public', rel));
	} catch {
		return false;
	}
}

export const CV_AVAILABLE = resolveCvAvailable();
