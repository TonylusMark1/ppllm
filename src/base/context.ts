import path from 'path';
import fs from 'fs';
import process from 'process';

import * as Utils from '../helpers/utils.js';
import * as TypeUtils from "../helpers/type-utils.js";

import * as Consts from './consts.js';
import GetCLIOptions, { CLIOptions, CLISettingsOptions, CLISettingsOptionsDefaults } from "./cli.js";
import { i18n, Translation } from './i18n.js';

//

export interface Config {
    prompt?: string;
    ignore?: string[];
}

//

export class Context {
    private static readonly instance = new Context();

    static Get() {
        return this.instance;
    }

    //

    readonly cli: CLIOptions;
    readonly settings: CLISettingsOptions;

    readonly T: Translation;

    //

    readonly absoluteSourceDirectory: string;
    readonly absoluteOutputPath: string | null;

    readonly fileContentMaxSizeInBytes?: number;

    //

    private constructor() {
        this.cli = GetCLIOptions();

        //

        this.absoluteSourceDirectory = path.resolve(process.cwd(), this.cli.dir);

        this.settings = this.initSettings();

        //

        this.absoluteOutputPath = path.resolve(process.cwd(), this.settings.file);

        //

        this.T = (() => {
            if (Consts.LANGUAGE_CODES.includes(this.settings.language))
                return i18n[this.settings.language];

            throw new Error(`Unknown language: ${this.settings.language}`);
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
                console.error(`${this.settings.emoji ? `${Consts.EMOJI.error} ` : ''}Invalid value for --max-size: ${this.settings.maxSize}`);
                process.exit(1);
            }
        })();
    }

    //

    private initSettings() {
        const fromFileSettings = this.readSettingsFile();

        //

        // define settings made by user
        const userSettings: TypeUtils.ExtendWith<CLISettingsOptions, null> = {
            file: this.cli.file ?? fromFileSettings?.file ?? null,
            preset: this.cli.preset ?? fromFileSettings?.preset ?? null,
            binary: this.cli.binary ?? fromFileSettings?.binary ?? null,
            maxSize: this.cli.maxSize ?? fromFileSettings?.maxSize ?? null,
            language: this.cli.language ?? fromFileSettings?.language ?? null,
            emoji: this.cli.emoji ?? fromFileSettings?.emoji ?? null,
        }

        // back it up by default values
        const userSettingsBackedByDefaults: CLISettingsOptions = {
            file: userSettings.file ?? CLISettingsOptionsDefaults.file,
            preset: userSettings.preset ?? CLISettingsOptionsDefaults.preset,
            binary: userSettings.binary ?? CLISettingsOptionsDefaults.binary,
            maxSize: userSettings.maxSize ?? CLISettingsOptionsDefaults.maxSize,
            language: userSettings.language ?? CLISettingsOptionsDefaults.language,
            emoji: userSettings.emoji ?? CLISettingsOptionsDefaults.emoji,
        };

        //

        if (this.cli.store) {
            // store settings made by users
            const storeSettings = <Partial<CLISettingsOptions>>Object.fromEntries(
                Object.entries(userSettings)
                    .filter(([_, value]) => value !== null)
            );

            this.storeSettingsFile(storeSettings);            

            console.error(`${userSettingsBackedByDefaults.emoji ? `${Consts.EMOJI.saved} ` : ''}Settings saved to root config file`);
        }

        //

        return userSettingsBackedByDefaults;
    }

    //

    readConfigFile(cfgPath: string) {
        const directory = path.dirname(cfgPath);

        //

        try {
            const content = fs.readFileSync(cfgPath, 'utf8');
            const config = JSON.parse(content) as Config;

            if (Array.isArray(config.ignore)) {
                config.ignore = config.ignore.map(p => path.resolve(directory, p));
            }

            return config;
        }
        catch {
            return undefined;
        }
    }

    //

    private readSettingsFile() {
        const settingsPath = path.join(process.cwd(), this.cli.settings);

        try {
            const content = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(content) as Partial<CLISettingsOptions>;

            return settings;
        }
        catch {
            return undefined;
        }
    }

    private storeSettingsFile(settings: Partial<CLISettingsOptions>) {
        const settingsPath = path.join(process.cwd(), this.cli.settings);
        
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    }
}

//

export default Context.Get();
