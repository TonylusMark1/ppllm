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
    template: string;
    file: string;
    preset: "disable" | (string & {});
    maxSize: "disable" | string;
    binary: "none" | "tree" | "all";
    emoji: boolean;
}

//

export default class Config {
    static RegisterSettingsOptions(option: ScopedRegisterOptionCallback) {
        option(
            { groupName: "settings" },
            {
                flags: '-t, --template <template>',
                description: `Handlebars template used to generate prompt.`,
                defaultValue: Templates.Default,

                validation: [...Templates.List, { pattern: Consts.REGEXP_FILENAME, description: "filename string" }],
            }
        );
        option(
            { groupName: "settings" },
            {
                flags: '-f, --file <filename>',
                description: `Filename for output file.`,
                defaultValue: Consts.DEFAULT_OUTPUT_FILENAME,

                validation: [{ pattern: Consts.REGEXP_FILENAME, description: "filename string" }],
            }
        );
        option(
            { groupName: "settings" },
            {
                flags: '-p, --preset <preset>',
                description: 'Preset of ignore list to use',
                defaultValue: "disable",

                validation: ["disable", ...PresetLoader.List],
                valueParser: (x: string) => x.toLowerCase(),
            }
        );
        option(
            { groupName: "settings" },
            {
                flags: '-m, --max-size <size>',
                description: 'Set maximum file size to load.',
                defaultValue: "disable",

                validation: ["disable", { pattern: /^[0-9]+(KB|MB|GB)$/i, description: "e.g. 100KB, 5MB, 1GB" }],
                valueParser: (x: string) => x.toLowerCase(),
            }
        );
        option(
            { groupName: "settings" },
            {
                flags: '-b, --binary <mode>',
                description: `Binary file mode.`,
                defaultValue: "tree",

                validation: ["none", "tree", "all"],
                valueParser: (x: string) => x.toLowerCase(),
            }
        );
        option(
            { groupName: "settings" },
            {
                flags: '-e, --emoji',
                description: `Render emoji in prompt and messages.`,
                defaultValue: false,
            }
        );
    }

    //

    private readonly parent: CommandGeneric;

    readonly configAbsPath: string;

    private readonly configJSON: ConfigJSON;

    readonly settings: SettingsOptions;
    readonly userSettings: Partial<SettingsOptions>;

    readonly ignore: string[];

    //

    constructor(parent: CommandGeneric, directoryAbsPath: string) {
        this.parent = parent;

        //

        this.configAbsPath = path.resolve(directoryAbsPath, this.parent.o.config);

        //

        this.configJSON = this.read();

        //

        this.ignore = this.configJSON.ignore ?? [];

        //

        ({ settings: this.settings, userSettings: this.userSettings } = this.initSettings(this.configJSON.settings));
    }

    //

    private read(): ConfigJSON {
        try {
            return JSON.parse(
                fs.readFileSync(this.configAbsPath, 'utf8')
            );
        }
        catch (err) {
            return {};
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

    private initSettings(fromFile_settings: ConfigJSON["settings"]) {
        const fromCLI_settings = this.getSettingsOptions();
        const fromCLI_userProvidedSettings = this.getSettingsOptions(true);

        //

        const userSettings = <Partial<SettingsOptions>>(
            Object.fromEntries(
                Object.keys(fromCLI_settings)
                    .map(key => {
                        return [
                            key,
                            (fromCLI_userProvidedSettings as any)[key] ?? (fromFile_settings as any)?.[key] ?? undefined
                        ];
                    })
                    .filter(x => !!x[1]) //filtering undefined values
            )
        );

        //

        const settings = <SettingsOptions>(
            Object.fromEntries(
                Object.keys(fromCLI_settings)
                    .map(key => {
                        return [
                            key,
                            (userSettings as any)[key] ?? (fromCLI_settings as any)[key]
                        ];
                    })
            )
        );

        //

        if (fromFile_settings) {
            for (const key in fromFile_settings) {
                const val = (fromFile_settings as any)[key];

                if ( !val )
                    continue;

                //

                const valFromCliUserProvided = (fromCLI_userProvidedSettings as any)[key];

                const valid = this.parent.ppllm.cmderw.isOptionValueValid(key, val);
                const validFromCliUserProvided = this.parent.ppllm.cmderw.isOptionValueValid(key, valFromCliUserProvided);

                if (valid === false && !validFromCliUserProvided) {
                    this.parent.ppllm.logger.error(Emoji.General.Error, `Invalid setting value in config file, Key '${key}' can't be ${JSON.stringify(val)}.`);
                    process.exit(-1);
                }
            }
        }

        //

        this.storeUserSettings(fromCLI_userProvidedSettings);

        //

        return { settings, userSettings };
    }

    private storeUserSettings(userSettings: Partial<SettingsOptions>) {
        if ( !Object.keys(userSettings).length ) {
            //this.parent.ppllm.logger.log(Emoji.General.Saved, "No new settings to save in the config file.");
            return;
        }

        //

        let currentConfigJSON = this.read();

        currentConfigJSON = { settings: {}, ...currentConfigJSON }; // just for moving settings to the top
        currentConfigJSON.settings = userSettings;

        //

        try {
            fs.writeFileSync(this.configAbsPath, JSON.stringify(currentConfigJSON, undefined, 2), "utf8");

            //this.parent.ppllm.logger.log(Emoji.General.Saved, "Settings stored to config file.");
        }
        catch(err) {
            this.parent.ppllm.logger.error(Emoji.General.Error, "Storing settings to config file failed, err: " + err);
        }
    }
}