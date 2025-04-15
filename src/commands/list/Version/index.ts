import path from "path";
import fs from "fs";

import * as colorette from "colorette";

import * as Emoji from '@/src/global/emoji.js';

import * as Utils from '@/src/helpers/utils.js';

import type PPLLM from '@/src/index.js';

import CommandGeneric from "../../Generic.js";

//

interface CommandArguments {
}

//

export default class CommandVersion extends CommandGeneric {
    static get Name() {
        return "version";
    }

    static get Description() {
        return `Show version of PPLLM`;
    }

    //

    constructor(ppllm: PPLLM) {
        super(ppllm);
    }

    //

    async start() {
        const packageJsonPath = path.resolve(Utils.getProjectRoot(), "package.json");
        const packageJsonStr = fs.readFileSync(packageJsonPath, "utf8");
        const packageJson = JSON.parse(packageJsonStr);

        this.ppllm.logger.logBoxedMessage(`${Emoji.General.Success} ProjectPromptLLM version is ${colorette.bold(colorette.underline(packageJson.version))}`);
    }
}