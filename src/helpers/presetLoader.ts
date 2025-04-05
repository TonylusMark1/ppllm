import path from 'path';
import fs from 'fs';
import url from 'url';

// Ustal ścieżkę do katalogu pliku tego modułu
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//

const PRESETS_DIR = path.resolve(`${__dirname}/../../assets/presets/ignore`);
const GENERAL_FILENAME = '_general.ignore.json';

//

export async function LoadPreset(presetName: string, rootDir: string): Promise<string[]> {
    if (presetName === 'false')
        return [];

    const all: string[] = [];

    try {
        // _general jest zawsze włączany (jeśli preset != false)
        const general = await loadFile(GENERAL_FILENAME);
        all.push(...general);
    }
    catch {
        console.warn(`⚠️ Cannot load general preset`);
    }

    if (presetName !== 'general') {
        try {
            const preset = await loadFile(`${presetName}.ignore.json`);
            all.push(...preset);
        }
        catch {
            console.warn(`⚠️ Preset "${presetName}" not found.`);
        }
    }

    return all.map(p => path.resolve(rootDir, p));
}

//

async function loadFile(name: string): Promise<string[]> {
    const fullPath = path.join(PRESETS_DIR, name);
    const raw = await fs.promises.readFile(fullPath, 'utf8');
    return JSON.parse(raw);
}

//

export async function ListAvailablePresets(): Promise<string[]> {
    const files = await fs.promises.readdir(PRESETS_DIR);

    return files
        .filter(f => f.endsWith('.ignore.json') && !f.startsWith('_'))
        .map(f => f.split('.')[0]); // np. node.ignore.json → node
}