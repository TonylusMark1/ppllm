import fs from 'fs';
import path from 'path';

import * as Emoji from '@/src/global/emoji.js';

import * as Utils from '@/src/helpers/utils.js';

import Templates from '@/src/Templates.js';
import { TreeNode, TreeNodeDir } from './TreeNode.js';

import type CommandGenerate from './index.js';

//

interface TemplateData {
	fileTree: string;
	innerPrompts: TemplateInnerPrompt[];
	files: TemplateFile[];
}

interface TemplateInnerPrompt {
	directory: string;
	directoryIsEmpty: boolean;

	prompt: string;
}

interface TemplateFile {
	path: string;
	isBinary: boolean;

	exception: boolean;
	content: string;
}

//

export default class PromptGenerator {
	private readonly parent: CommandGenerate;

	//

	constructor(parent: CommandGenerate) {
		this.parent = parent;
	}

	//

	async generate(root: TreeNodeDir): Promise<string> {
		const template = Templates.Load(this.parent.settings.template, true);

		//

		const fileTree = this.parent.treePrinter.print(root);
		const innerPrompts = this.collectInnerPrompts(root);
		const files = await this.collectFiles(root);

		//

		if (this.parent.ppllm.settingsHandler.settings.emoji) {
			for (const innerPrompt of innerPrompts) {
				const emoji = innerPrompt.directoryIsEmpty ? Emoji.Files.General.EmptyFolder : Emoji.Files.General.Folder;

				innerPrompt.directory = `${emoji} ${innerPrompt.directory}`;
			}

			for (const file of files) {
				const ext = path.extname(file.path);
				const emoji = Emoji.Files.PerExt[ext] ?? (file.isBinary ? Emoji.Files.General.AnyNonBinaryFile : Emoji.Files.General.AnyBinaryFile);

				file.path = `${emoji} ${file.path}`;
			}
		}

		//

		const data: TemplateData = {
			fileTree,
			innerPrompts,
			files,
		};

		//

		return template(data);
	}

	//

	private collectInnerPrompts(node: TreeNodeDir, root: TreeNodeDir = node) {
		let results: TemplateInnerPrompt[] = [];

		for (const child of node.files) {
			if (child instanceof TreeNodeDir) {
				if (child.dirconfig?.prompt) {
					const filePathWithRoot = path.join(root.fileName, child.relativePath);

					results.push({
						directory: filePathWithRoot,
						directoryIsEmpty: child.isEmptyDir,
						prompt: child.dirconfig.prompt
					});
				}

				results = results.concat(this.collectInnerPrompts(child, root));
			}
		}

		return results;
	}

	private async collectFiles(root: TreeNodeDir) {
		const flatFiles = TreeNode.Flatten(root.files);
		flatFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

		const fileContentMaxSizeInBytes = (() => {
			if (this.parent.settings.maxSize === 'disable')
				return undefined;

			return Utils.ConvertSizeToBytes(this.parent.settings.maxSize);
		})();

		//

		const files: TemplateFile[] = [];

		//

		for (const file of flatFiles) {
			if (file.isBinary && this.parent.settings.binary !== 'all')
				continue;

			//

			const templateFile: TemplateFile = {
				path: path.join(root.fileName, file.relativePath),
				isBinary: file.isBinary,

				exception: false,
				content: "",
			};

			//

			try {
				const stats = await fs.promises.stat(file.absolutePath);

				//

				if (file.isBinary) {
					templateFile.content = `File is binary and was not loaded`;
					templateFile.exception = true;
				}
				else if (fileContentMaxSizeInBytes && stats.size > fileContentMaxSizeInBytes) {
					templateFile.content = `File is too large and was not loaded`;
					templateFile.exception = true;
				}
				else {
					templateFile.content = await fs.promises.readFile(file.absolutePath, 'utf8');
				}
			}
			catch (err) {
				templateFile.content = `File read error: ${err}`;
				templateFile.exception = true;

				this.parent.ppllm.logger.error(Emoji.General.Error, templateFile.content);
			}

			//

			files.push(templateFile);
		}

		//

		return files;
	}
}