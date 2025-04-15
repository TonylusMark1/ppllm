import fs from 'fs';
import path from 'path';

import * as Emoji from '@/src/global/emoji.js';

import * as Utils from '@/src/helpers/utils.js';
import FileTreeNode from '@/src/helpers/FileTreeNode/index.js';

import Templates from '@/src/Templates.js';

import type CommandGenerate from './index.js';

//

interface TemplateData {
	fileTree: string;
	files: TemplateFile[];
}

interface TemplateFile {
	path: string;

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

	async generate(root: FileTreeNode): Promise<string> {
		const template = Templates.Load(this.parent.config.settings.template, true);

		//

		const { files, isBinaryMap } = await this.collectFilesWithBinaryInfo(root);

		//

		const templateFileTree = FileTreeNode.Print(root, {
			emoji: !this.parent.config.settings.emoji ? undefined : (node: FileTreeNode) => {
				if (node.isDirectory) {
					return node.isDirectoryEmpty
						? Emoji.Files.General.EmptyFolder
						: Emoji.Files.General.Folder;
				}
				else {
					return (
						Emoji.Files.PerExt[node.extension] ??
						(isBinaryMap.get(node) ? Emoji.Files.General.AnyBinaryFile : Emoji.Files.General.AnyNonBinaryFile)
					);
				}
			}
		});

		//

		const templateFiles = files
			.filter(file => this.parent.config.settings.binary == 'all' || !isBinaryMap.get(file))
			.map(file => {
				const isBinary = isBinaryMap.get(file)!;

				const templateFile = this.convertFileTreeNodeToTemplateFile(root.absPath, file, isBinary);

				//

				if (this.parent.config.settings.emoji) {
					const emoji = (
						Emoji.Files.PerExt[file.extension] ??
							(isBinary ? Emoji.Files.General.AnyBinaryFile : Emoji.Files.General.AnyNonBinaryFile)
					);

					templateFile.path = `${emoji} ${templateFile.path}`;
				}

				//

				return templateFile;
			});

		//

		const data: TemplateData = {
			fileTree: templateFileTree,
			files: templateFiles,
		};

		//

		return template(data);
	}

	//

	private async collectFilesWithBinaryInfo(root: FileTreeNode, chunkSize: number = 100) {
		const files = FileTreeNode.GetAllFilesNodes(root);
	
		const isBinaryMap = new WeakMap<FileTreeNode, boolean>();
	
		for (let i = 0; i < files.length; i += chunkSize) {
			const chunk = files.slice(i, i + chunkSize);
	
			const results = await Promise.all(
				chunk.map(file => Utils.IsFileBinary(file.absPath))
			);
	
			chunk.forEach((file, index) => {
				isBinaryMap.set(file, results[index]);
			});
		}
	
		return { files, isBinaryMap };
	}
	

	private convertFileTreeNodeToTemplateFile(rootAbsPath: string, file: FileTreeNode, isBinary: boolean) {
		const templateFile: TemplateFile = {
			path: path.relative(rootAbsPath, file.absPath),

			exception: false,
			content: "",
		};

		//

		try {
			if (isBinary) {
				templateFile.content = `File is binary and was not loaded`;
				templateFile.exception = true;
			}
			else if (this.parent.fileContentMaxSizeInBytes && file.stats.size > this.parent.fileContentMaxSizeInBytes) {
				templateFile.content = `File is too large and was not loaded`;
				templateFile.exception = true;
			}
			else {
				templateFile.content = fs.readFileSync(file.absPath, 'utf8');
			}
		}
		catch (err) {
			templateFile.content = `File read error: ${err}`;
			templateFile.exception = true;

			this.parent.ppllm.logger.error(Emoji.General.Error, templateFile.content);
		}

		//

		return templateFile;
	}
}