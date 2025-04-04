#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import * as Consts from './base/consts.js';
import ctx from './base/context.js';
import * as Utils from './helpers/utils.js';
import { LoadPreset } from './helpers/presetLoader.js';
import TreeScanner from './TreeScanner.js';
import PromptGen from './PromptGen.js';
//
class PPLLM {
    static async Main() {
        try {
            const presetMatchers = await this.LoadPresetMatchers();
            const dirNode = await TreeScanner.ScanDir(ctx.absoluteSourceDirectory, presetMatchers);
            const prompt = await PromptGen.Generate(dirNode);
            await this.OutputResult(prompt);
        }
        catch (err) {
            console.error(`${ctx.settings.emoji ? `${Consts.EMOJI.error} ` : ''}${ctx.T.error}`, err);
        }
    }
    //
    static async LoadPresetMatchers() {
        const presetPatterns = await LoadPreset(ctx.settings.preset, ctx.absoluteSourceDirectory);
        return Utils.BuildIgnoreMatchers(ctx.absoluteSourceDirectory, ctx.absoluteSourceDirectory, presetPatterns);
    }
    //
    static async OutputResult(prompt) {
        if (!ctx.absoluteOutputPath) {
            process.stdout.write(prompt, 'utf8');
        }
        else {
            await fs.writeFile(ctx.absoluteOutputPath, prompt, 'utf8');
            const relPath = path.relative(process.cwd(), ctx.absoluteOutputPath);
            const displayPath = relPath.startsWith('..') ? ctx.absoluteOutputPath : `./${relPath}`;
            console.log(`${ctx.settings.emoji ? `${Consts.EMOJI.success} ` : ''}${ctx.T.successFile(displayPath)}`);
        }
    }
}
PPLLM.Main();
