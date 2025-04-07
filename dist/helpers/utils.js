import { fileTypeFromFile } from 'file-type';
import { isBinaryFile } from 'isbinaryfile';
import slash from "slash";
//
export function ConvertPathToPOSIX(path) {
    return slash(path);
}
// Funkcja parsująca rozmiar pliku; zwraca liczbę bajtów.
export function ConvertSizeToBytes(input) {
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
// Funkcja sprawdzająca, czy dany plik jest binarny.
export async function IsFileBinary(filePath) {
    const type = await fileTypeFromFile(filePath);
    if (type) {
        if (type?.mime.startsWith('text/'))
            return false;
        return true;
    }
    return await isBinaryFile(filePath);
}
