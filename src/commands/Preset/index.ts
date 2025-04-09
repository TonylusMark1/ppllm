import { CommandArgument } from 'commanderwrapper';

import * as Emoji from '@/src/global/emoji.js';

import type PPLLM from '@/src/index.js';
import PresetLoader from '@/src/PresetLoader.js';

import CommandGeneric from "../Generic.js";

//

interface CommandArguments {
    name?: string;
}

//

export default class CommandPreset extends CommandGeneric {
    static get Name() {
        return "preset";
    }

    static get Description() {
        return 'Prints built-in preset list or content of choosen preset.';
    }

    static Arguments(): CommandArgument[] {
        return [
            {
                name: "name",
                required: false,
                validation: [...PresetLoader.List],
            },
        ]
    }

    //

    constructor(ppllm: PPLLM) {
        super(ppllm);
    }

    //

    async start() {
        const presetName = this.ppllm.cmderw.getCommandArguments<CommandArguments>().name;

        //

        if (presetName) {
            try {
                const preset = await this.ppllm.presetLoader.loadPresetFile(presetName);

                //

                this.ppllm.logger.log(Emoji.General.Success, `Built-in '${presetName}' preset:\n\n` + JSON.stringify(preset, undefined, 2) + "\n");
            }
            catch (err: any) {
                this.ppllm.logger.error(Emoji.General.Error, `Error: ` + err.messages);
            }
        }
        else {
            this.ppllm.logger.log(
                Emoji.General.Success,
                `Built-in preset list:\n\n${JSON.stringify(PresetLoader.List, null, 2)}\n\n` +
                `Preset 'general' is always loaded with choosen preset during prompt generation.` +
                `\n`
            );
        }
    }
}