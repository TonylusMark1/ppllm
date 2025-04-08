import { CommandArgument } from '../../CommanderWrapper/index.js';

import * as Emoji from '../../global/emoji.js';

import type PPLLM from '../../index.js';

import CommandGeneric from "../Generic.js";

//

interface CommandArguments {
    name: string;
}

//

export default class CommandPreset extends CommandGeneric {
    static get Name() {
        return "preset";
    }

    static get Description() {
        return 'Prints choosen built-in preset';
    }

    static Arguments(): CommandArgument[] {
        return [
            {
                name: "name",
                required: true,
                validation: [/^[a-z0-9_\-]+$/i],
            }
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

        try {
            const preset = await this.ppllm.presetLoader.loadPresetFile(presetName);

            //

            console.log(`Built-in '${presetName}' preset:\n`);
            console.log(JSON.stringify(preset, undefined, 2));
        }
        catch(err: any) {
            console.error(`${this.ppllm.settingsHandler.settings.emoji ? `${Emoji.General.Error} ` : ''} Error: ` + err.messages);
        }
    }
}