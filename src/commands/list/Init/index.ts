import path from "path";
import fs from "fs";

import * as colorette from 'colorette';

import { ScopedRegisterOptionCallback } from 'commanderwrapper';

import * as Consts from '@/src/global/consts.js';
import * as Emoji from '@/src/global/emoji.js';

import type PPLLM from '@/src/index.js';

import Templates from "@/src/Templates.js";

import Config, { SettingsOptions, Validations, Defaults, BinaryModes } from "../../common/Config.js";

import CommandGeneric from "../../Generic.js";

import CLIPrompting, { CLIPromptingInputChoice } from "./CLIPrompting.js";

//

interface CommandArguments { }

interface Options {
    config: string;
}

//

export default class CommandInit extends CommandGeneric<Options> {
    static get Name() {
        return "init";
    }

    static get Description() {
        return `Initializes config file in current working directory.`;
    }

    static Options(option: ScopedRegisterOptionCallback, ppllm: PPLLM): void {
        option(
            {
                groupName: "general",

                flags: '-c, --config <filename>',
                description: 'Name of the config file.',
                defaultValue: Consts.DEFAULT_CONFIG_FILENAME,

                validation: [{ pattern: Consts.REGEXP_FILENAME, description: "filename string" }],
            }
        );

        //

        Config.RegisterSettingsOptions(option);
    }

    //

    readonly config: Config;

    //

    constructor(ppllm: PPLLM) {
        super(ppllm);

        //

        this.config = new Config(this, path.join(process.cwd(), this.o.config));
    }

    //

    async start() {
        this.ppllm.logger.logBoxedMessage(`${Emoji.General.Working} Initializing settings...`);
        
        //

        const promptedSettings: Partial<SettingsOptions> = {};

        //

        if (this.config.fromCLIUserProvidedSettings["dir"] === undefined) {
            promptedSettings["dir"] = await this.promptSetting_dir();
        }

        if (this.config.fromCLIUserProvidedSettings["template"] === undefined) {
            promptedSettings["template"] = await this.promptSetting_template();
        }

        if (this.config.fromCLIUserProvidedSettings["file"] === undefined) {
            promptedSettings["file"] = await this.promptSetting_file();
        }

        if (this.config.fromCLIUserProvidedSettings["preset"] === undefined) {
            promptedSettings["preset"] = await this.promptSetting_preset();
        }

        if (this.config.fromCLIUserProvidedSettings["maxSize"] === undefined) {
            promptedSettings["maxSize"] = await this.promptSetting_maxsize();
        }

        if (this.config.fromCLIUserProvidedSettings["binary"] === undefined) {
            promptedSettings["binary"] = await this.promptSetting_binary();
        }

        if (this.config.fromCLIUserProvidedSettings["emoji"] === undefined) {
            promptedSettings["emoji"] = await this.promptSetting_emoji();
        }

        //

        const merged: Partial<SettingsOptions> = {...this.config.userSettings, ...promptedSettings};

        this.config.storeSettings(merged);

        //

        this.ppllm.logger.logEmptyLine();
        this.ppllm.logger.log(`${Emoji.General.Saved} Settings stored in config file: ${path.relative(process.cwd(), this.config.configAbsPath)}`);
    }

    //

    private setMarking(choices: CLIPromptingInputChoice[], param: keyof SettingsOptions) {
        if (this.config.fromFileSettings[param] !== undefined) {
            const found = choices.find(c => c.value == this.config.fromFileSettings[param])!;
            found.marking = `(Current - in config file)`;
        }
        else {
            const found = choices.find(c => c.value == Defaults[param])!;
            found.marking = `(Current - as built-in default)`;
        }
    }

    //

    async promptSetting_dir() {
        const answer = await CLIPrompting.PromptStringInput(
            `📁 ` + colorette.underline(`Entry directory for scanning:`),
            {
                defaultValue: this.config.fromFileSettings["dir"] ?? Defaults["dir"],
                validator: (input: string) => {
                    if (this.ppllm.cmderw.isValueValid(input, Validations["dir"]))
                        return true;
    
                    return `Invalid directory path`;
                }
            }
        );

        //

        if (!answer || answer.trim().length === 0)
            return undefined;

        //

        return answer;
    }

    async promptSetting_template() {
        const values = [...Templates.List];

        if (this.config.fromFileSettings["template"] && !Templates.List.includes(this.config.fromFileSettings["template"]))
            values.unshift(this.config.fromFileSettings["template"]);

        //

        const choices = values.map(v => {
            const c: CLIPromptingInputChoice = {
                value: v
            };

            return c;
        });

        this.setMarking(choices, "template");

        //

        return await CLIPrompting.PromptChoiceWithCustomInput(
            "📄 " + colorette.underline("Name/filename of template for prompt generating:"),
            choices,
            {
                defaultValue: this.config.fromFileSettings["template"] ?? Defaults["template"],
                validator: (input: string) => {
                    if ( !input || input.trim().length === 0 )
                        return `Filename can't be empty`;
    
                    if (this.ppllm.cmderw.isValueValid(input, Validations["template"])) {
                        if ( Templates.List.includes(input) ) {
                            return true;
                        }
                        else {
                            try {
                                if (!fs.existsSync(path.resolve(process.cwd(), input)))
                                    return `File not found`;
                                else
                                    return true;
                            }
                            catch (err) {
                                return `Sth went wrong: ${err}`;
                            }
                        }
                    }
    
                    return `Invalid template name/filename`;
                },
                placeholder: "filename"
            }
        );
    }

    async promptSetting_file() {
        const answer = await CLIPrompting.PromptStringInput(
            `📄 ` + colorette.underline(`Filename for generated prompt:`),
            {
                defaultValue: this.config.fromFileSettings["file"] ?? Defaults["file"],
                validator: (input: string) => {
                    if (this.ppllm.cmderw.isValueValid(input, Validations["file"]))
                        return true;
    
                    return `Invalid filename`;
                }
            }
        );

        //

        if (!answer || answer.trim().length === 0)
            return undefined;

        //

        return answer;
    }

    async promptSetting_preset() {
        const choices = Validations["preset"].filter(x => typeof x == "string").map(str => {
            const c: CLIPromptingInputChoice = {
                value: str,
            }

            return c;
        });

        //

        const answer = await CLIPrompting.PromptMultipleChoiceInput(
            `🧾 ` + colorette.underline(`Preset(s) to skip common files and folders`),
            choices,
            {
                defaultValue: this.config.fromFileSettings["preset"] ?? Defaults["preset"]
            }
        );

        //

        return answer;
    }

    async promptSetting_maxsize() {
        const answer = await CLIPrompting.PromptStringInput(
            `⚖️  ` + colorette.underline(`Max file size to include contents (e.g. disable, 10MB, 5KB):`),
            {
                defaultValue: this.config.fromFileSettings["maxSize"] ?? Defaults["maxSize"],
                validator: (input: string) => {
                    if (this.ppllm.cmderw.isValueValid(input, Validations["maxSize"]))
                        return true;
    
                    return `Invalid value`;
                }
            }
        );

        //

        return answer;
    }

    async promptSetting_binary() {
        const choices: (CLIPromptingInputChoice & { value: typeof BinaryModes[number], description?: string })[] = [
            { value: "tree", description: "In tree view" },
            { value: "all", description: "In tree view & file contents" },
            { value: "none", description: "Won't appear" },
        ];

        this.setMarking(choices, "binary");

        //

        const answer = await CLIPrompting.PromptChoiceInput(
            `📦 ` + colorette.underline(`Displaying binary files in generated prompt:`),
            choices,
            {
                defaultValue: this.config.fromFileSettings["binary"] ?? Defaults["binary"],
            }
        );

        //

        return answer;
    }

    async promptSetting_emoji() {
        const choices: CLIPromptingInputChoice[] = [
            { name: "yes", short: "yes", value: true },
            { name: "no", short: "no", value: false },
        ];

        this.setMarking(choices, "emoji");

        //

        return await CLIPrompting.PromptChoiceInput(
            `✨ ` + colorette.underline(`Display emoji in generated prompt?`),
            choices,
            {
                defaultValue: this.config.fromFileSettings["emoji"] ?? Defaults["emoji"],
            }
        );
    }
}