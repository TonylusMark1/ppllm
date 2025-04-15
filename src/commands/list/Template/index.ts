import path from "path";
import fs from "fs";

import { CommandArgument, ScopedRegisterOptionCallback } from 'commanderwrapper';

import * as Emoji from '@/src/global/emoji.js';

import type PPLLM from '@/src/index.js';

import Templates from '@/src/Templates.js';

import CommandGeneric from "../../Generic.js";

//

interface CommandArguments {
    name: string;
}

//

export default class CommandTemplate extends CommandGeneric {
    static get Name() {
        return "template";
    }

    static get Description() {
        return `Creates template (for custom prompt template) or config in current working directory.`;
    }

    static Arguments(): CommandArgument[] {
        return [
            {
                name: "name",
                required: false,
                validation: [{pattern: /^[a-zA-Z0-9_\-]+$/, description: "Letter, digit, underscore and hypen only"}],
                default: "custom",
            },
        ] as CommandArgument[];
    }

    //

    constructor(ppllm: PPLLM) {
        super(ppllm);
    }

    //

    async start() {
        const name = this.ppllm.cmderw.getCommandArguments<CommandArguments>().name;

        //

        const filename = `${name}.prompt.hbs`;
        const filePath = path.resolve(process.cwd(), filename);

        //

        if (fs.existsSync(filePath)) {
            this.ppllm.logger.error(Emoji.General.Error, `File ${filename} already exists in current working directory.`);
            process.exit(-1);
        }

        //

        const defaultTemplateStr = Templates.Load(Templates.Default, false);

        fs.writeFileSync(filePath, defaultTemplateStr, "utf-8");

        //

        const relFilePath = path.relative(process.cwd(), filePath);

        this.ppllm.logger.log(Emoji.General.Saved, `Cloned default template to: ${relFilePath}`);
    }
}