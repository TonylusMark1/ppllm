import path from 'path';
import fs from 'fs';
import url from 'url';

import type PPLLM from './index.js';

//

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//

export default class PresetLoader {
    private static readonly PRESETS_DIR = path.resolve(`${__dirname}/../assets/presets/ignore`);
    private static readonly GENERAL_FILENAME = '_general.ignore.json';

    //

    private readonly ppllm: PPLLM;

    //

    constructor(ppllm: PPLLM) {
        this.ppllm = ppllm;
    }

    //

    public async load(presetName: string): Promise<string[]> {
        if (presetName === 'disable')
            return [];

        const all: string[] = [];

        try {
            // _general jest zawsze włączany (jeśli preset != false)
            const general = await this.loadFile(PresetLoader.GENERAL_FILENAME);
            all.push(...general);
        }
        catch {
            console.trace(`⚠️ Cannot load general preset`);
        }

        if (presetName !== 'general') {
            try {
                const preset = await this.loadFile(`${presetName}.ignore.json`);
                all.push(...preset);
            }
            catch {
                console.trace(`⚠️ Preset "${presetName}" not found.`);
            }
        }

        return all;
    }

    public list(): string[] {
        const files = fs.readdirSync(PresetLoader.PRESETS_DIR);

        return files
            .filter(f => f.endsWith('.ignore.json') && !f.startsWith('_'))
            .map(f => f.split('.')[0]); // np. node.ignore.json → node
    }

    //

    private async loadFile(name: string): Promise<string[]> {
        const fullPath = path.join(PresetLoader.PRESETS_DIR, name);
        const raw = await fs.promises.readFile(fullPath, 'utf8');

        return JSON.parse(raw);
    }
}
