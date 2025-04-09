import path from "path";
import fs from "fs";

import { CommandArgument } from 'commanderwrapper';

import * as Emoji from '@/src/global/emoji.js';

import type PPLLM from '@/src/index.js';

import CommandGeneric from "../Generic.js";

//

interface CommandArguments {
    name?: string;
}

//

export default class CommandTemplate extends CommandGeneric {
    static get Name() {
        return "init";
    }

    static get Description() {
        return `Interactive mode for defining settings.`;
    }

    //

    constructor(ppllm: PPLLM) {
        super(ppllm);
    }

    //

    async start() {

    }
}