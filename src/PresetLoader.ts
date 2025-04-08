import path from 'path';
import fs from 'fs';

import * as Utils from '@/src/helpers/utils.js';

//

export default class PresetLoader {
    private static readonly DIRECTORY = path.resolve(Utils.getProjectRoot(), `./assets/presets/ignore`);
    
    private static readonly GENERAL_PRESET_NAME = '_general';
    private static readonly SUFFIX = '.ignore.json';

    //

    readonly list: string[];

    //

    constructor() {
        this.list = (() => {
            const files = fs.readdirSync(PresetLoader.DIRECTORY);

            return files
                .filter(f => f.endsWith(PresetLoader.SUFFIX) && !f.startsWith(PresetLoader.GENERAL_PRESET_NAME))
                .map(f => f.split('.')[0]); // np. node.ignore.json → node
        })();
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
        if ( !this.list.includes(name) && name != PresetLoader.GENERAL_PRESET_NAME )
            throw new Error(`Built-in preset '${name}' doesn't exist.`);

        //

        const fullPath = path.join(PresetLoader.DIRECTORY, `${name}.ignore.json`);
        const raw = await fs.promises.readFile(fullPath, 'utf8');

        //

        return JSON.parse(raw) as string[];
    }
}
