import path from "path";
import fs from "fs";

import { CommandArgument, ScopedRegisterOptionCallback } from 'commanderwrapper';

import * as Emoji from '@/src/global/emoji.js';

import type PPLLM from '@/src/index.js';

import Templates from '@/src/Templates.js';

import CommandGeneric from "../../Generic.js";

//

interface CommandArguments {
    mode: "template" | "config";
}

interface Options {
    name: string;
}

//

export default class CommandTemplate extends CommandGeneric<Options> {
    static get Name() {
        return "init";
    }

    static get Description() {
        return `Creates template (for custom prompt template) or config in current working directory.`;
    }

    static Arguments(): CommandArgument[] {
        return [
            {
                name: "mode",
                required: false,
                validation: ["template", "config"],
                default: "config",
            },
        ]
    }

    static Options(option: ScopedRegisterOptionCallback, ppllm: PPLLM): void {
        option(
            { groupName: "general" },
            {
                flags: '-n, --name <string>',
                description: 'name for custom template: [name].prompt.hbs',
                defaultValue: 'custom',

                validation: [{ pattern: /^[a-zA-Z0-9_\-]+$/, description: "Letters, digits, underscore and hypen only" }],
            }
        );
    }

    //

    constructor(ppllm: PPLLM) {
        super(ppllm);
    }

    //

    async start() {
        const mode = this.ppllm.cmderw.getCommandArguments<CommandArguments>().mode;

        if (mode == "template")
            await this.cloneTemplate();
    }

    //

    private async cloneTemplate() {
        const filename = `${this.o.name}.prompt.hbs`;
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