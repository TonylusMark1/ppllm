import path from 'path';
import fs from 'fs';

import * as Emoji from './global/emoji.js';

import * as Utils from './helpers/utils.js';
import * as TypeUtils from "./helpers/type-utils.js";

import type CLI from './CLI.js';

//

export interface SettingsCLIOptions {
    file: string;
    preset: "disable" | "general" | string;
    maxSize: "disable" | string;
    binary: "none" | "tree" | "all";
    language: string;
    emoji: boolean;
}

//

export default class SettingsHandler {
    private readonly cli: CLI;

    readonly o: SettingsCLIOptions;

    readonly fileContentMaxSizeInBytes?: number;

    //

    constructor(cli: CLI) {
        this.cli = cli;

        this.o = this.initSettings();

        //

        this.fileContentMaxSizeInBytes = (() => {
            if (this.o.maxSize == "disable")
                return undefined; // brak limitu

            //

            try {
                return Utils.ConvertSizeToBytes(this.o.maxSize);
            }
            catch (err: any) {
                console.error(`${this.o.emoji ? `${Emoji.General.Error} ` : ''}Invalid value for --max-size: ${this.o.maxSize}`);
                process.exit(1);
            }
        })();
    }

    //

    getOptions<T extends boolean = false>(onlyUserProvided?: T): T extends true ? Partial<SettingsCLIOptions> : SettingsCLIOptions {
        return this.cli.cmderw.getOptions({
            groupName: "settings",
            onlyUserProvided: onlyUserProvided ?? false
        });
    }

    //

    private initSettings() {
        const fromFile_settings = this.readSettingsFile();

        //

        for ( const key in fromFile_settings ) {
            const val = (fromFile_settings as any)[key];

            const valid = this.cli.cmderw.isOptionValueValidForCurrentCommand(key, val);

            if ( !valid ) {
                console.error(`${this.cli.o.emoji ? `${Emoji.General.Error} ` : ''}Invalid setting value in settings file: '${key}' can't be ${JSON.stringify(val)}`);
                process.exit(-1);
            }
        }

        //

        const fromCLI_settings = this.getOptions();
        const fromCLI_userProvidedSettings = this.getOptions(true);

        //

        const userSettings: TypeUtils.ExtendEachParamWith<SettingsCLIOptions, undefined> = {
            file: fromCLI_userProvidedSettings.file ?? fromFile_settings.file ?? undefined,
            preset: fromCLI_userProvidedSettings.preset ?? fromFile_settings.preset ?? undefined,
            binary: fromCLI_userProvidedSettings.binary ?? fromFile_settings.binary ?? undefined,
            maxSize: fromCLI_userProvidedSettings.maxSize ?? fromFile_settings.maxSize ?? undefined,
            language: fromCLI_userProvidedSettings.language ?? fromFile_settings.language ?? undefined,
            emoji: fromCLI_userProvidedSettings.emoji ?? fromFile_settings.emoji ?? undefined,
        }

        const settings: SettingsCLIOptions = {
            file: userSettings.file ?? fromCLI_settings.file,
            preset: userSettings.preset ?? fromCLI_settings.preset,
            binary: userSettings.binary ?? fromCLI_settings.binary,
            maxSize: userSettings.maxSize ?? fromCLI_settings.maxSize,
            language: userSettings.language ?? fromCLI_settings.language,
            emoji: userSettings.emoji ?? fromCLI_settings.emoji,
        };

        //

        if (this.cli.o.store) {
            const savedTo = this.storeSettingsFile(userSettings);

            console.log(`${settings.emoji ? `${Emoji.General.Saved} ` : ''}Settings saved to: ${path.relative(process.cwd(), savedTo)}`);
        }

        //

        return settings;
    }

    private readSettingsFile() {
        const settingsPath = path.join(process.cwd(), this.cli.o.settings);

        try {
            const content = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(content) as Partial<SettingsCLIOptions>;

            return settings;
        }
        catch {
            return {};
        }
    }

    private storeSettingsFile(settings: Partial<SettingsCLIOptions>) {
        const settingsPath = path.resolve(process.cwd(), this.cli.o.settings);

        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

        return settingsPath;
    }
}