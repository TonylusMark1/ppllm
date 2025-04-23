#!/usr/bin/env node

import CommanderWrapper, { ScopedRegisterOptionCallback } from 'commanderwrapper';

import Logger from '@/src/Logger.js';

import CommandGeneric from "@/src/commands/Generic.js";
import CommandInit from "@/src/commands/list/Init/index.js";
import CommandGenerate from "@/src/commands/list/Generate/index.js";
import CommandPreset from "@/src/commands/list/Preset/index.js";
import CommandVersion from "@/src/commands/list/Version/index.js";

import PresetLoader from './PresetLoader.js';


//

export default class PPLLM {
	static readonly CommandsSet = new Set<typeof CommandGeneric<Record<string, any>>>();
	static readonly DefaultCommand = CommandGenerate;

	static {
		this.CommandsSet.add(CommandInit);
		this.CommandsSet.add(CommandGenerate);
		this.CommandsSet.add(CommandPreset);
		this.CommandsSet.add(CommandVersion);
	}

	//

	readonly logger = new Logger(this);

	readonly cmderw: CommanderWrapper;

	private command?: CommandGeneric;

	readonly presetLoader = new PresetLoader();

	//

	constructor() {
		this.cmderw = new CommanderWrapper();

		this.initCommands();

		this.cmderw.parse();

		//

		const commandName = this.cmderw.getUsedCommand();
		const commandClass = Array.from(PPLLM.CommandsSet).find(Class => Class.Name == commandName);

		//

		if (!commandClass)
			throw new Error(`Couldn't find class bound to '${commandName}' command.`);

		//

		this.command = new commandClass(this);
	}

	//

	private initCommands() {
		PPLLM.CommandsSet.forEach(ClassOfCommand => {
			this.cmderw.registerCommand(
				{
					name: ClassOfCommand.Name,
					description: ClassOfCommand.Description,
					isDefault: ClassOfCommand == PPLLM.DefaultCommand,
					arguments: ClassOfCommand.Arguments(),
				},
				(option) => {
					ClassOfCommand.Options(option, this);
				}
			);
		});
	}

	//

	async start() {
		await this.command?.start();
	}
}

//

const ppllm = new PPLLM();
ppllm.start();