#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import process from 'process';

import { Minimatch } from 'minimatch';

import * as Consts from './global/consts.js';
import * as Emoji from './global/emoji.js';
import CommandLineInterface, * as CLI from "./CommandLineInterface.js";
import { i18n, Translation } from './global/i18n.js';

import * as Utils from './helpers/utils.js';
import * as TypeUtils from "./helpers/type-utils.js";
import { LoadPreset } from './helpers/presetLoader.js';

import TreeScanner from './TreeScanner.js';
import PromptGenerator from './PromptGenerator.js';

//

export interface DirConfig {
    prompt?: string;
    ignore?: string[];
}

//

export default class PPLLM {
	readonly cli: CLI.CLIOptions;
	readonly settings: CLI.CLISettingsOptions;
	
	readonly T: Translation;
	
	//
	
	readonly absoluteSourceDirectory: string;
	readonly absoluteOutputPath: string | null;
	
	readonly fileContentMaxSizeInBytes?: number;
	
	//

	private readonly treeScanner = new TreeScanner(this);
	private readonly promptGenerator = new PromptGenerator(this);

	//

	constructor() {
		this.cli = CommandLineInterface.Get();

        //

        this.absoluteSourceDirectory = path.resolve(process.cwd(), this.cli.dir);

        this.settings = this.initSettings();

        //

        this.absoluteOutputPath = path.resolve(process.cwd(), this.settings.file);

		//

		this.T = (() => {
            if (Consts.LANGUAGE_CODES.includes(this.settings.language))
                return i18n[this.settings.language];

            console.error(`${this.settings.emoji ? `${Emoji.General.Error} ` : ''}Unknown language: ${this.settings.language}`);
            process.exit(1);
        })();

        //

        this.fileContentMaxSizeInBytes = (() => {
            if (this.settings.maxSize.toLowerCase() === '0' || this.settings.maxSize.toLowerCase() === 'false')
                return undefined; // brak limitu

            //

            try {
                return Utils.ConvertSizeToBytes(this.settings.maxSize);
            }
            catch (err: any) {
                console.error(`${this.settings.emoji ? `${Emoji.General.Error} ` : ''}Invalid value for --max-size: ${this.settings.maxSize}`);
                process.exit(1);
            }
        })();
	}

	//

	private initSettings() {
        const fromFileSettings = this.readSettingsFile();

        //

        // define settings made by user
        const userSettings: TypeUtils.ExtendWith<CLI.CLISettingsOptions, null> = {
            file: this.cli.file ?? fromFileSettings?.file ?? null,
            preset: this.cli.preset ?? fromFileSettings?.preset ?? null,
            binary: this.cli.binary ?? fromFileSettings?.binary ?? null,
            maxSize: this.cli.maxSize ?? fromFileSettings?.maxSize ?? null,
            language: this.cli.language ?? fromFileSettings?.language ?? null,
            emoji: this.cli.emoji ?? fromFileSettings?.emoji ?? null,
        }

        // back it up by default values
        const userSettingsBackedByDefaults: CLI.CLISettingsOptions = {
            file: userSettings.file ?? CLI.CLISettingsOptionsDefaults.file,
            preset: userSettings.preset ?? CLI.CLISettingsOptionsDefaults.preset,
            binary: userSettings.binary ?? CLI.CLISettingsOptionsDefaults.binary,
            maxSize: userSettings.maxSize ?? CLI.CLISettingsOptionsDefaults.maxSize,
            language: userSettings.language ?? CLI.CLISettingsOptionsDefaults.language,
            emoji: userSettings.emoji ?? CLI.CLISettingsOptionsDefaults.emoji,
        };

        //

        if (this.cli.store) {
            // store settings made by users
            const storeSettings = <Partial<CLI.CLISettingsOptions>>Object.fromEntries(
                Object.entries(userSettings)
                    .filter(([_, value]) => value !== null)
            );

            const savedTo = this.storeSettingsFile(storeSettings);

            console.error(`${userSettingsBackedByDefaults.emoji ? `${Emoji.General.Saved} ` : ''}Settings saved to: ${path.relative(process.cwd(), savedTo)}`);
        }

        //

        return userSettingsBackedByDefaults;
    }

	private readSettingsFile() {
        const settingsPath = path.join(process.cwd(), this.cli.settings);

        try {
            const content = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(content) as Partial<CLI.CLISettingsOptions>;

            return settings;
        }
        catch {
            return undefined;
        }
    }

    private storeSettingsFile(settings: Partial<CLI.CLISettingsOptions>) {
        const settingsPath = path.resolve(process.cwd(), this.cli.settings);
        
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

        return settingsPath;
    }

	//

	async start() {
		try {
			const presetMatchers = await this.loadPresetMatchers();

			const dirNode = await this.treeScanner.scanDir(this.absoluteSourceDirectory, presetMatchers);

			const prompt = await this.promptGenerator.generate(dirNode);

			this.outputResult(prompt);
		}
		catch (err) {
			console.error(`${this.settings.emoji ? `${Emoji.General.Error} ` : ''}${this.T.error}`, err);
		}
	}

	//

	private async loadPresetMatchers() {
		const presetPatterns = await LoadPreset(this.settings.preset, this.absoluteSourceDirectory);

		return this.buildIgnoreMatchers(this.absoluteSourceDirectory, this.absoluteSourceDirectory, presetPatterns);
	}

	//

	private outputResult(prompt: string) {
		if (!this.absoluteOutputPath) {
			process.stdout.write(prompt, 'utf8');
		}
		else {
			fs.writeFileSync(this.absoluteOutputPath, prompt, 'utf8');

			const relPath = path.relative(process.cwd(), this.absoluteOutputPath);
			const displayPath = relPath.startsWith('..') ? this.absoluteOutputPath : `./${relPath}`;

			console.log(`${this.settings.emoji ? `${Emoji.General.Saved} ` : ''}${this.T.promptSuccessFile(displayPath)}`);
		}
	}

    //

    buildIgnoreMatchers(rootDir: string, dir: string, ignorePatterns: string[]): Minimatch[] {
        return ignorePatterns.map(p => {
            const patternAbsolute = path.resolve(dir, p);
            const relativeToRoot = path.relative(rootDir, patternAbsolute);
    
            const pattern = Utils.ConvertPathToPOSIX(relativeToRoot);
    
            return new Minimatch(pattern, {
                dot: true,
                matchBase: false
            });
        });
    }

	//

	readDirConfigFile(cfgPath: string) {
        const directory = path.dirname(cfgPath);

        //

        try {
            const content = fs.readFileSync(cfgPath, 'utf8');
            const dirconfig = JSON.parse(content) as DirConfig;

            if (Array.isArray(dirconfig.ignore))
                dirconfig.ignore = dirconfig.ignore.map(p => path.resolve(directory, p));

            return dirconfig;
        }
        catch {
            return undefined;
        }
    }
}

//

const ppllm = new PPLLM();

ppllm.start();