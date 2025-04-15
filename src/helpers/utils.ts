import path from "path";
import url from "url";

import { fileTypeFromFile } from 'file-type';
import { isBinaryFile } from 'isbinaryfile';
import slash from "slash";

//

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//

export function getProjectRoot(): string {
	// @ts-expect-error injected by bundler (tsup) for dist version of ppllm
	if (typeof __PROJECT_ROOT__ !== "undefined") {
		// @ts-expect-error injected by bundler (tsup) for dist version of ppllm
		return path.resolve(__dirname, __PROJECT_ROOT__);
	}

	const currentDirectory = path.dirname(url.fileURLToPath(import.meta.url));

	return path.resolve(currentDirectory, '../../');
}

export function ConvertPathToPOSIX(path: string) {
	return slash(path);
}

export function ConvertSizeToBytes(input: string): number {
	const match = /^(\d+) *(B|KB|MB|GB)?$/i.exec(input);

	if (!match)
		throw new Error(`Invalid max size value: ${input}`);

	const number = parseInt(match[1], 10);
	const unit = (match[2] || 'B').toUpperCase();

	let multiplier = 1;

	switch (unit) {
		case 'B':
			multiplier = 1;
			break;
		case 'KB':
			multiplier = 1024;
			break;
		case 'MB':
			multiplier = 1024 * 1024;
			break;
		case 'GB':
			multiplier = 1024 * 1024 * 1024;
			break;
		default:
			multiplier = 1;
	}

	return number * multiplier;
}

export async function IsFileBinary(filePath: string): Promise<boolean> {
	const type = await fileTypeFromFile(filePath);

	if (type) {
		if (type?.mime.startsWith('text/'))
			return false;

		return true;
	}

	return await isBinaryFile(filePath);
}