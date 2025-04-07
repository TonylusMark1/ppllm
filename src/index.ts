#!/usr/bin/env node

import process from 'process';

import * as Consts from './global/consts.js';
import * as Emoji from './global/emoji.js';
import { i18n, Translation } from './global/i18n.js';

import PresetLoader from './PresetLoader.js';
import CLI from "./CLI.js";

import CommandGeneric from "./commands/Generic.js";
import CommandGenerate from "./commands/Generate/index.js";

//

export default class PPLLM {
	readonly presetLoader = new PresetLoader(this);
	readonly cli = new CLI(this);

    readonly T: Translation;
	
	private command?: CommandGeneric;

	//

	constructor() {
		this.T = (() => {
            if (Consts.LANGUAGE_CODES.includes(this.cli.settings.o.language))
                return i18n[this.cli.settings.o.language];

            console.error(`${this.cli.settings.o.emoji ? `${Emoji.General.Error} ` : ''}Unknown language: ${this.cli.settings.o.language}`);
            process.exit(1);
        })();

		//

		const commandName = this.cli.getCommand();

		switch(commandName) {
			case "gen":
					this.command = new CommandGenerate(this);
				break;
			case "preset":
				break;
		}
	}

	//

	async start() {
		await this.command?.start();
	}
}

//

const ppllm = new PPLLM();

ppllm.start();