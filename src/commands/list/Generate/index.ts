import path from 'path';
import fs from 'fs';
import process from 'process';

import { ScopedRegisterOptionCallback } from 'commanderwrapper';

import * as Consts from '@/src/global/consts.js';
import * as Emoji from '@/src/global/emoji.js';

import FileTreeNode from '@/src/helpers/FileTreeNode/index.js';
import * as Utils from '@/src/helpers/utils.js';

import type PPLLM from '@/src/index.js';

import Config from "../../common/Config.js";

import CommandGeneric from "../../Generic.js";

import PromptGenerator from './PromptGenerator.js';

//

interface Options {
    output: "stdout" | "file";
    config: string;
}

//

export default class CommandGenerate extends CommandGeneric<Options> {
    static get Name() {
        return "generate";
    }

    static get Description() {
        return 'Generates prompt.';
    }

    static Options(option: ScopedRegisterOptionCallback, ppllm: PPLLM): void {
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
        option(
            { groupName: "general" },
            {
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

    readonly fileContentMaxSizeInBytes?: number;

    private readonly ignore: string[];

    readonly promptGenerator: PromptGenerator;

    //

    constructor(ppllm: PPLLM) {
        super(ppllm);

        //

        this.config = new Config(this, path.join(process.cwd(), this.o.config));

        //

        this.fileContentMaxSizeInBytes = (() => {
			if (this.config.settings.maxSize === 'disable')
				return undefined;

			return Utils.ConvertSizeToBytes(this.config.settings.maxSize);
		})();

        //

        const preset = (
            this.config.settings.preset != "disable"
                ?
                this.ppllm.presetLoader.loadPreset(this.config.settings.preset)
                :
                undefined
        );
        
        //
       
        const coreIgnores = [`./${this.o.config}`, `./${this.config.settings.file}`];

        //

        this.ignore = [...coreIgnores, ...(preset?.ignore ?? []), ...this.config.ignore];

        //

        this.promptGenerator = new PromptGenerator(this);
    }

    //

    async start() {
        try {
            const tree = await FileTreeNode.Scan(
                path.resolve(process.cwd(), this.config.settings.dir),
                ["**/*"],
                {
                    ignore: this.ignore
                }
            );

            const prompt = await this.promptGenerator.generate(tree);

            this.outputResult(prompt);
        }
        catch (err) {
            this.ppllm.logger.error(Emoji.General.Error, `Error:`, err);
        }
    }

    //

    private outputResult(prompt: string) {
        if (this.o.output == "stdout") {
            process.stdout.write(prompt, 'utf8');
        }
        else {
            const outputPath = path.join(process.cwd(), this.config.settings.file);

            fs.writeFileSync(outputPath, prompt, 'utf8');

            const relPath = path.relative(process.cwd(), outputPath);
            const displayPath = relPath.startsWith('..') ? outputPath : `./${relPath}`;

            this.ppllm.logger.log(Emoji.General.Saved, `Prompt generated and saved to file: ${displayPath}`);
        }
    }
}