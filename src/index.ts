#!/usr/bin/env node

import CommanderWrapper, { ScopedRegisterOptionCallback } from './CommanderWrapper/index.js';

import * as Consts from '@/src/global/consts.js';

import CommandGeneric from "./commands/Generic.js";
import CommandGenerate from "./commands/Generate/index.js";
import CommandPreset from "./commands/Preset/index.js";

import DirConfigHandler from './DirConfigHandler.js';
import PresetLoader from './PresetLoader.js';
import SettingsHandler, { SettingsOptions } from './SettingsHandler.js';

//

export interface Options extends Partial<SettingsOptions> {
	settings: string;
	store: boolean;
}

//

export default class PPLLM {
	static readonly CommandsSet = new Set<typeof CommandGeneric<Record<string, any>>>();
	static readonly DefaultCommand = CommandGenerate;

	static {
		this.CommandsSet.add(CommandGenerate);
		this.CommandsSet.add(CommandPreset);
	}

	//

	readonly dirConfigHandler: DirConfigHandler;

	readonly cmderw: CommanderWrapper;

	readonly o: Options;

	readonly settingsHandler: SettingsHandler;

	private command?: CommandGeneric;

	readonly presetLoader = new PresetLoader();

	//

	constructor() {
		this.dirConfigHandler = new DirConfigHandler(this);

		//

		this.cmderw = new CommanderWrapper();

		this.initCommands();

		try {
			this.cmderw.parse();
		}
		catch (err) {
			console.log(err);
			process.exit(-1);
		}

		//

		this.o = this.cmderw.getOptions();

		//

		this.settingsHandler = new SettingsHandler(this);

		//

		if (this.o.store)
			this.settingsHandler.storeUserSettings();

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
				ClassOfCommand.Name,
				ClassOfCommand.Description,
				{
					isDefault: ClassOfCommand == PPLLM.DefaultCommand,
					arguments: ClassOfCommand.Arguments(),
				},
				(option) => {
					this.registerOptions(option);
					SettingsHandler.RegisterOptions(option);
					ClassOfCommand.Options(option, this);
				}
			);
		});
	}

	//

	async start() {
		await this.command?.start();
	}

	//

	private registerOptions(option: ScopedRegisterOptionCallback) {
		option(
			{ groupName: "general" },
			{
				flags: '-S, --settings <filename>',
				description: 'Name of the settings file.',
				defaultValue: Consts.DEFAULT_SETTINGS_FILENAME,

				validation: [{ pattern: /^.+$/i, description: "filename string" }],
			}
		);
		option(
			{ groupName: "general" },
			{
				flags: '-s, --store',
				description: 'Store used settings into file in cwd.',
				defaultValue: false,
			}
		);
	}
}

//

const ppllm = new PPLLM();
ppllm.start();