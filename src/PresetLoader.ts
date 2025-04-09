import path from 'path';
import fs from 'fs';

import * as Utils from '@/src/helpers/utils.js';

//

export default class PresetLoader {
    private static readonly DIRECTORY = path.resolve(Utils.getProjectRoot(), `./assets/presets/ignore`);

    private static readonly GENERAL_PRESET_NAME = 'general';
    private static readonly SUFFIX = '.ignore.json';

    static readonly List: string[] = (() => {
        const files = fs.readdirSync(PresetLoader.DIRECTORY);

        return files
            .filter(f => f.endsWith(PresetLoader.SUFFIX))
            .map(f => f.split('.')[0]) // node.ignore.json → node
    })();

    //

    async loadPreset(presetName: string): Promise<string[]> {
        const all: string[] = [];

        //

        all.push( // PresetLoader.GENERAL_PRESET_NAME is always included
            ...await this.loadPresetFile(PresetLoader.GENERAL_PRESET_NAME)
        );

        presetName !== 'general' && all.push(
            ...await this.loadPresetFile(presetName)
        );

        //

        return all;
    }

    //

    async loadPresetFile(name: string) {
        if (!PresetLoader.List.includes(name))
            throw new Error(`Built-in preset '${name}' doesn't exist.`);

        //

        const fullPath = path.join(PresetLoader.DIRECTORY, `${name}.ignore.json`);
        const raw = await fs.promises.readFile(fullPath, 'utf8');

        //

        return JSON.parse(raw) as string[];
    }
}
