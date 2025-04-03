import path from 'path';

import { fileTypeFromFile } from 'file-type';
import { isBinaryFile } from 'isbinaryfile';
import { Minimatch } from 'minimatch';
import slash from "slash";

//

export function ConvertPathToPOSIX(path: string) {
	return slash(path);
}

// Funkcja parsująca rozmiar pliku; zwraca liczbę bajtów.
export function ConvertSizeToBytes(input: string): number {
	const match = /^(\d+)(B|KB|MB|GB)?$/i.exec(input);

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

// Funkcja sprawdzająca, czy dany plik jest binarny.
export async function IsFileBinary(filePath: string): Promise<boolean> {
	const type = await fileTypeFromFile(filePath);

	if (type) {
		if (type?.mime.startsWith('text/'))
			return false;

		return true;
	}

	return await isBinaryFile(filePath);
}

//

export function BuildIgnoreMatchers(rootDir: string, dir: string, ignorePatterns: string[]): Minimatch[] {
	return ignorePatterns.map(p => {
		const patternAbsolute = path.resolve(dir, p);
		const relativeToRoot = path.relative(rootDir, patternAbsolute);

		const pattern = ConvertPathToPOSIX(relativeToRoot);

		return new Minimatch(pattern, {
			dot: true,
			matchBase: false
		});
	});
}
