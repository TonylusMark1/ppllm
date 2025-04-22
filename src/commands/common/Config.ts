import path from 'path';
import fs from 'fs';

import { ScopedRegisterOptionCallback } from 'commanderwrapper';

import * as Consts from '@/src/global/consts.js';
import * as Emoji from '@/src/global/emoji.js';

import Templates from '@/src/Templates.js';
import PresetLoader from '@/src/PresetLoader.js';

import type CommandGeneric from '../Generic.js';

//

interface ConfigJSON {
    settings?: Partial<SettingsOptions>;
    ignore?: string[];
}

//

export interface SettingsOptions {
    dir: string;
    template: string;
    file: string;
    preset: string[];
    maxSize: "disable" | (string & {});
    binary: typeof Validations["binary"][number];
    emoji: boolean;
}

//

export const BinaryModes = ["tree", "all", "none"] as const;

export const Defaults: SettingsOptions = {
    "dir": "./",
    "template": Templates.Default,
    "file": Consts.DEFAULT_OUTPUT_FILENAME,
    "preset": [],
    "maxSize": "disable" satisfies "disable" | (string & {}),
    "binary": "tree" satisfies typeof BinaryModes[number],
    "emoji": false
};

export const Validations = {
    "dir": [{ pattern: Consts.REGEXP_DIRECTORY_PATH, description: "directory path" }],
    "template": [...Templates.List, { pattern: Consts.REGEXP_FILENAME, description: "filename string" }],
    "file": [{ pattern: Consts.REGEXP_FILENAME, description: "filename string" }],
    "preset": PresetLoader.List,
    "maxSize": ["disable", { pattern: /^[0-9]+(KB|MB|GB)$/i, description: "e.g. 100KB, 5MB, 1GB" }],
    "binary": [...BinaryModes],
};

//

export default class Config {
    static RegisterSettingsOptions(option: ScopedRegisterOptionCallback) {
        option(
            {
                groupName: "settings",

                flags: '-d, --dir <dir>',
                description: 'Source directory to scan.',
                defaultValue: Defaults["dir"],

                validation: Validations["dir"],
            }
        );
        option(
            {
                groupName: "settings",

                flags: '-t, --template <template>',
                description: `Handlebars template used to generate prompt.`,
                defaultValue: Defaults["template"],

                validation: Validations["template"],
            }
        );
        option(
            {
                groupName: "settings",

                flags: '-f, --file <filename>',
                description: `Filename for output file.`,
                defaultValue: Defaults["file"],

                validation: Validations["file"],
            }
        );
        option(
            {
                groupName: "settings",

                flags: '-p, --preset <preset...>',
                description: 'Preset of ignore list to use',
                defaultValue: Defaults["preset"],

                validation: Validations["preset"],
                valueParser: (x: string) => x.toLowerCase(),
            }
        );
        option(
            {
                groupName: "settings",

                flags: '-m, --max-size <size>',
                description: 'Set maximum file size to load.',
                defaultValue: Defaults["maxSize"],

                validation: Validations["maxSize"],
                valueParser: (x: string) => x.toLowerCase(),
            }
        );
        option(
            {
                groupName: "settings",

                flags: '-b, --binary <mode>',
                description: `Binary file mode.`,
                defaultValue: Defaults["binary"],

                validation: Validations["binary"],
                valueParser: (x: string) => x.toLowerCase(),
            }
        );
        option(
            {
                groupName: "settings",

                flags: '-e, --emoji',
                description: `Render emoji in prompt and messages.`,
                defaultValue: Defaults["emoji"],
            }
        );
    }

    //

    private readonly parent: CommandGeneric;

    readonly configAbsPath: string;

    private readonly configJSON: ConfigJSON;

    readonly fromCLIUserProvidedSettings: Partial<SettingsOptions>;
    readonly fromFileSettings: Partial<SettingsOptions>;

    readonly settings: SettingsOptions;
    readonly userSettings: Partial<SettingsOptions>;

    readonly ignore: string[];

    //

    constructor(parent: CommandGeneric, configPath: string) {
        this.parent = parent;

        //

        this.configAbsPath = path.resolve(configPath);

        //

        this.configJSON = this.read();

        this.fromCLIUserProvidedSettings = this.getSettingsOptions(true);
        this.fromFileSettings = this.configJSON.settings ?? {};

        //

        this.ignore = this.configJSON.ignore ?? [];

        //

        ({ settings: this.settings, userSettings: this.userSettings } = this.initSettings());
    }

    //

    private read(): ConfigJSON {
        try {
            return JSON.parse(
                fs.readFileSync(this.configAbsPath, 'utf8')
            );
        }
        catch (err) {
            return {
                settings: {},
                ignore: []
            };
        }
    }

    //

    private getSettingsOptions(): SettingsOptions;
    private getSettingsOptions(onlyUserProvided: false): SettingsOptions;
    private getSettingsOptions(onlyUserProvided: true): Partial<SettingsOptions>;
    private getSettingsOptions(onlyUserProvided: boolean = false): SettingsOptions | Partial<SettingsOptions> {
        return this.parent.ppllm.cmderw.getOptions({
            groupName: "settings",
            onlyUserProvided: onlyUserProvided ?? false
        });
    }

    //

    private initSettings() {
        const fromCLI_settingsWithDefaults = this.getSettingsOptions();
        const fromCLI_userProvidedSettings = this.getSettingsOptions(true);

        //

        const userSettings = <Partial<SettingsOptions>>(
            Object.fromEntries(
                Object.keys(fromCLI_settingsWithDefaults)
                    .map(key => {
                        return [
                            key,
                            (fromCLI_userProvidedSettings as any)[key] ?? (this.fromFileSettings as any)?.[key] ?? undefined
                        ];
                    })
                    .filter(x => x[1] !== undefined) //filtering undefined values
            )
        );

        //

        const settings = <SettingsOptions>(
            Object.fromEntries(
                Object.keys(fromCLI_settingsWithDefaults)
                    .map(key => {
                        return [
                            key,
                            (userSettings as any)[key] ?? (fromCLI_settingsWithDefaults as any)[key]
                        ];
                    })
            )
        );

        //

        if (this.fromFileSettings) {
            for (const key in this.fromFileSettings) {
                const val = (this.fromFileSettings as any)[key];

                if ( !val )
                    continue;

                //

                const valFromCliUserProvided = (fromCLI_userProvidedSettings as any)[key];

                const valid = this.parent.ppllm.cmderw.isOptionAssigneValid(key, val);
                const validFromCliUserProvided = valFromCliUserProvided && this.parent.ppllm.cmderw.isOptionAssigneValid(key, valFromCliUserProvided);

                if (valid === false && !validFromCliUserProvided) {
                    this.parent.ppllm.logger.error(Emoji.General.Error, `Invalid setting value in config file, Key '${key}' can't be ${JSON.stringify(val)}.`);
                    process.exit(-1);
                }
            }
        }

        //

        this.storeSettings(userSettings);

        //

        return { settings, userSettings };
    }

    storeSettings(settings: Partial<SettingsOptions>) {
        if ( !Object.keys(settings).length )
            return;

        //

        let currentConfigJSON = this.read();

        currentConfigJSON = { settings: {}, ...currentConfigJSON }; // just for moving settings to the top
        currentConfigJSON.settings = settings;

        //

        try {
            fs.writeFileSync(this.configAbsPath, JSON.stringify(currentConfigJSON, undefined, 2), "utf8");
        }
        catch(err) {
            this.parent.ppllm.logger.error(Emoji.General.Error, "Storing settings to config file failed, err: " + err);
        }
    }
}