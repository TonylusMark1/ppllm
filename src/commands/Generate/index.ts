import path from 'path';
import fs from 'fs';
import process from 'process';

import { Minimatch } from 'minimatch';
import { ScopedRegisterOptionCallback } from '../../CommanderWrapper/index.js';

import * as Consts from '../../global/consts.js';
import * as Emoji from '../../global/emoji.js';

import * as Utils from '../../helpers/utils.js';

import type PPLLM from '../../index.js';
import type { Options as PPLLM_Options } from '../../index.js';
import type { SettingsOptions as PPLLM_SettingsOptions } from '../../SettingsHandler.js';

import CommandGeneric from "../Generic.js";

import TreePrinter from './TreePrinter.js';
import TreeScanner from './TreeScanner.js';
import PromptGenerator from './PromptGenerator.js';

//

export interface Options extends PPLLM_Options, Partial<SettingsOptions> {
    dir: string;
    output: "stdout" | "file";
}

export interface SettingsOptions extends PPLLM_SettingsOptions {
    template: string;
    file: string;
    preset: "disable" | "general" | string;
    maxSize: "disable" | string;
    binary: "none" | "tree" | "all";
}

//

export default class CommandGenerate extends CommandGeneric<Options> {
    static get Name() {
        return "generate";
    }

    static get Description() {
        return 'Generate prompt';
    }

    static Options(option: ScopedRegisterOptionCallback, ppllm: PPLLM): void {
        option(
            { groupName: "general" },
            {
                flags: '-d, --dir <dir>',
                description: 'Source directory to scan.',
                defaultValue: '.',

                validation: [{ pattern: /^.+$/i, description: "directory path" }],
            }
        );
        option(
            { groupName: "general" },
            {
                flags: '-o, --output <mode>',
                description: `Output mode, default is file.`,
                defaultValue: 'file',

                validation: ["stdout", "file"],
                valueParser: (x: string) => x.toLowerCase(),
            }
        );

        //

        option(
            { groupName: "settings" },
            {
                flags: '-t, --template <filename>',
                description: `Filename for output file.`,
                defaultValue: "default",

                validation: ["default", { pattern: /^.+$/i, description: "filename string" }],
            }
        );
        option(
            { groupName: "settings" },
            {
                flags: '-f, --file <filename>',
                description: `Filename for output file.`,
                defaultValue: Consts.DEFAULT_OUTPUT_FILENAME,

                validation: [{ pattern: /^.+$/i, description: "filename string" }],
            }
        );
        option(
            { groupName: "settings" },
            {
                flags: '-p, --preset <preset>',
                description: 'Preset of ignore list to use',
                defaultValue: "disable",

                validation: ["disable", "general", ...ppllm.presetLoader.list()],
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
    }

    //

    readonly absoluteSourceDirectory: string;
    readonly absoluteOutputPath: string;

    readonly treeScanner = new TreeScanner(this);
    readonly treePrinter = new TreePrinter(this);
    readonly promptGenerator = new PromptGenerator(this);

    //

    constructor(ppllm: PPLLM) {
        super(ppllm);

        //

        this.absoluteSourceDirectory = path.resolve(process.cwd(), this.o.dir);
        this.absoluteOutputPath = path.resolve(process.cwd(), this.settings.file);
    }

    //

    get settings() {
        return <SettingsOptions>this.ppllm.settingsHandler.settings;
    }

    //

    async start() {
        try {
            const presetMatchers = await this.getIgnorePresetMatchers();

            const dirNode = await this.treeScanner.scanDir(this.absoluteSourceDirectory, presetMatchers);

            const prompt = await this.promptGenerator.generate(dirNode);

            this.outputResult(prompt);
        }
        catch (err) {
            console.error(`${this.ppllm.settingsHandler.settings.emoji ? `${Emoji.General.Error} ` : ''} Error:`, err);
        }
    }

    //

    private async getIgnorePresetMatchers() {
        const presetPatterns = (
            (await this.ppllm.presetLoader.loadPreset(this.settings.preset))
                .map(p => path.resolve(this.absoluteSourceDirectory, p))
        );

        return this.buildIgnoreMatchers(this.absoluteSourceDirectory, this.absoluteSourceDirectory, presetPatterns);
    }
    
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

    private outputResult(prompt: string) {
        if (this.o.output == "stdout") {
            process.stdout.write(prompt, 'utf8');
        }
        else {
            fs.writeFileSync(this.absoluteOutputPath, prompt, 'utf8');

            const relPath = path.relative(process.cwd(), this.absoluteOutputPath);
            const displayPath = relPath.startsWith('..') ? this.absoluteOutputPath : `./${relPath}`;

            console.log(`${this.ppllm.settingsHandler.settings.emoji ? `${Emoji.General.Saved} ` : ''}Prompt generated and saved to file: ${displayPath}`);
        }
    }
}