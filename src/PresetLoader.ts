import path from 'path';
import fs from 'fs';
import url from 'url';

//

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//

export default class PresetLoader {
    private static readonly PRESETS_DIR = path.resolve(`${__dirname}/../assets/presets/ignore`);
    private static readonly GENERAL_PRESET_NAME = '_general';

    //

    list(): string[] {
        const files = fs.readdirSync(PresetLoader.PRESETS_DIR);

        return files
            .filter(f => f.endsWith('.ignore.json') && !f.startsWith('_'))
            .map(f => f.split('.')[0]); // np. node.ignore.json → node
    }

    //

    async loadPreset(presetName: string): Promise<string[]> {
        if (presetName === 'disable')
            return [];

        //

        const all: string[] = [];

        //

        try {
            // _general jest zawsze włączany (jeśli preset != false)
            const general = await this.loadPresetFile(PresetLoader.GENERAL_PRESET_NAME);
            all.push(...general);
        }
        catch(err) {
            throw new Error(`Cannot load general preset. Error:` + err);
        }

        //

        if (presetName !== 'general') {
            const preset = await this.loadPresetFile(presetName);
            all.push(...preset);
        }

        //

        return all;
    }

    //

    async loadPresetFile(name: string) {
        const filename = `${name}.ignore.json`;

        //

        if ( !await this.doesFileExist(filename) )
            throw new Error(`Built-in preset '${name}' doesn't exist.`);

        //

        return this.loadFile(filename);
    }

    //

    private async doesFileExist(filename: string) {
        try {
            const fullPath = path.join(PresetLoader.PRESETS_DIR, filename);
            await fs.promises.access(fullPath);
            return true;
        }
        catch {
            return false;
        }
    }

    private async loadFile(filename: string): Promise<string[]> {
        const fullPath = path.join(PresetLoader.PRESETS_DIR, filename);
        const raw = await fs.promises.readFile(fullPath, 'utf8');

        return JSON.parse(raw);
    }
}
