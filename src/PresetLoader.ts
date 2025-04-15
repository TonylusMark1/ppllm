import path from 'path';
import fs from 'fs';

import * as Utils from '@/src/helpers/utils.js';

//

interface PresetJSON {
    extends?: string | string[];
    ignore: string[];
}

interface Preset {
    ignore: string[];
}

//

export default class PresetLoader {
    private static readonly DIRECTORY = path.resolve(Utils.getProjectRoot(), `./assets/presets`);
    private static readonly SUFFIX = '.preset.json';

    private static readonly FileList: string[] = (() => {
        const files = fs.readdirSync(PresetLoader.DIRECTORY);

        return files
            .filter(f => f.endsWith(PresetLoader.SUFFIX));
    })();

    static readonly List: string[] = this.FileList.map(f => f.split('.')[0]) // nodejs.preset.json → nodejs

    //

    loadPreset(name: string) {
        const preset: Preset = {
            ignore: this.loadPresetRulesRecursive(name)
        };

        //

        return preset;
    }

    private loadPresetRulesRecursive(name: string, seen = new Set<string>()): string[] {
        if (seen.has(name))
            throw new Error(`Circular dependency detected in preset '${name}'.`);
    
        //

        seen.add(name);

        //

        const preset = this.loadPresetFile(name);

        const merged: string[] = [];

        //

        const extendsList = Array.isArray(preset.extends) ? preset.extends : (preset.extends ? [preset.extends] : []);

        for (const parentName of extendsList)
            merged.push(...this.loadPresetRulesRecursive(parentName, seen));

        //

        merged.push(...preset.ignore);

        //

        return merged;
    }

    //

    loadPresetFile(name: string) {
        if (!PresetLoader.List.includes(name))
            throw new Error(`Built-in preset '${name}' doesn't exist.`);

        //

        const fullPath = path.join(PresetLoader.DIRECTORY, `${name}${PresetLoader.SUFFIX}`);
        const content = fs.readFileSync(fullPath, 'utf8');

        //

        return <PresetJSON> JSON.parse(content);
    }
}
