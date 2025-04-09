import path from 'path';
import fs from 'fs';
import { ScopedRegisterOptionCallback } from 'commanderwrapper';

import * as Consts from '@/src/global/consts.js';
import * as Emoji from '@/src/global/emoji.js';

import type PPLLM from './index.js';

//

export interface SettingsOptions {
    dirconfig: string;
    emoji: boolean;
}

//

export default class SettingsHandler {
    static RegisterOptions(option: ScopedRegisterOptionCallback) {
		option(
			{ groupName: "settings" },
			{
				flags: '-c, --dirconfig <filename>',
				description: 'Name of the dirconfig file.',
				defaultValue: Consts.DEFAULT_DIRCONFIG_FILENAME,

				validation: [{ pattern: Consts.REGEXP_FILENAME, description: "filename string" }],
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

    private readonly ppllm: PPLLM;

    readonly settings: SettingsOptions;
    readonly userSettings: Partial<SettingsOptions>;

    //

    constructor(ppllm: PPLLM) {
        this.ppllm = ppllm;

        //

        ({ settings: this.settings, userSettings: this.userSettings } = this.init());
    }

    //

    private getOptions<T extends boolean = false>(onlyUserProvided?: T): T extends true ? Partial<SettingsOptions> : SettingsOptions {
        return this.ppllm.cmderw.getOptions({
            groupName: "settings",
            onlyUserProvided: onlyUserProvided ?? false
        });
    }

    //

    private init() {
        const fromFile_settings = this.readSettingsFile();

        //

        const fromCLI_settings = this.getOptions();
        const fromCLI_userProvidedSettings = this.getOptions(true);

        //

        const userSettings = <Partial<SettingsOptions>>(
            Object.fromEntries(
                Object.keys(fromCLI_settings)
                    .map(key => {
                        return [
                            key,
                            (fromCLI_userProvidedSettings as any)[key] ?? (fromFile_settings as any)[key] ?? undefined
                        ];
                    })
            )
        );

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

        for (const key in fromFile_settings) {
            const val = (fromFile_settings as any)[key];

            const valid = this.ppllm.cmderw.isOptionValueValid(key, val);

            if (valid === false) {
                console.error(`${settings.emoji ? `${Emoji.General.Error} ` : ''}Invalid setting value in settings file: '${key}' can't be ${JSON.stringify(val)}`);
                process.exit(-1);
            }
        }

        //

        return { settings, userSettings };
    }

    //

    storeUserSettings() {
        if (Object.keys(this.getOptions(true)).length) {
            const savedTo = this.storeSettingsFile(this.userSettings);
            const savedToRel = path.relative(process.cwd(), savedTo);

            console.log(`${this.settings.emoji ? `${Emoji.General.Saved} ` : ''}Settings saved to: ${savedToRel}`);
        }
        else {
            console.log(`${this.settings.emoji ? `${Emoji.General.Saved} ` : ''}No new settings to save`);
        }
    }

    //

    private readSettingsFile() {
        const settingsPath = path.join(process.cwd(), this.ppllm.o.settings);

        try {
            const content = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(content) as Partial<SettingsOptions>;

            return settings;
        }
        catch {
            return {};
        }
    }

    private storeSettingsFile(settings: Partial<SettingsOptions>) {
        const settingsPath = path.resolve(process.cwd(), this.ppllm.o.settings);

        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

        return settingsPath;
    }
}