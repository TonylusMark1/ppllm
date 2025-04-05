import fs from 'fs';
import path from 'path';

import * as Emoji from './global/emoji.js';

import type PPLLM from './index.js';
import { TreeNode, TreeNodeDir } from './TreeNode.js';

//

interface InnerPromptEntity {
	directory: string;
	prompt: string;
}

//

export default class PromptGenerator {
	private readonly ppllm: PPLLM;

	//

	constructor(ppllm: PPLLM) {
		this.ppllm = ppllm;
	}

	//

	async generate(root: TreeNodeDir): Promise<string> {
		const structure = this.printTree(root);

		let output = '';

		//

		output += `${this.ppllm.T.promptPlaceholder}\n\n`;

		//

		// Jeśli główny (zewnętrzny) dirconfig zawiera prompt – wyświetl go od razu po placeholderze
		if (root.dirconfig && root.dirconfig.prompt) {
			output += root.dirconfig.prompt + '\n\n';
		}

		//

		output += `${this.ppllm.settings.emoji ? `${Emoji.General.FileStructure} ` : ''}${this.ppllm.T.fileStructure}\n\n`;
		output += structure + '\n\n';

		//

		const innerPrompts = this.collectInnerPrompts(root); // Zbieramy inner prompty z wszystkich zagnieżdżonych katalogów

		if (innerPrompts.length)
			output += this.printInnerPrompts(root, innerPrompts) + "\n\n";

		//

		output += `${this.ppllm.settings.emoji ? `${Emoji.General.FileContents} ` : ''}${this.ppllm.T.fileContents}\n\n`;

		const flatFiles = TreeNode.Flatten(root.files);
		flatFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

		for (const file of flatFiles) {
			if (file.isBinary && this.ppllm.settings.binary !== 'all')
				continue; // Pomijamy binarne pliki z wyjątkiem trybu 'all'

			//
			
			let content = '';
			let placeholder: boolean = false;

			try {
				const stats = await fs.promises.stat(file.absolutePath);

				if (this.ppllm.fileContentMaxSizeInBytes && stats.size > this.ppllm.fileContentMaxSizeInBytes) {
					content = `[${this.ppllm.T.largeFile}]`;
					placeholder = true;
				}
				else if (file.isBinary) {
					content = `[${this.ppllm.T.binaryFile}]`;
					placeholder = true;
				}
				else {
					content = await fs.promises.readFile(file.absolutePath, 'utf8');
				}
			}
			catch {
				const readErrorMsg = this.ppllm.T.readError(file.absolutePath);
				content = `[${readErrorMsg}]`;
				placeholder = true;

				console.log(readErrorMsg);
			}

			const filePathWithRoot = path.join(root.fileName, file.relativePath);
			output += `${this.ppllm.T.file}: ${this.ppllm.settings.emoji ? `${file.emoji} ` : ''}${filePathWithRoot}\n`;

			if (placeholder) {
				output += content + '\n\n';
			}
			else {
				output += '```\n';
				output += content.trim() + '\n';
				output += '```\n\n';
			}
		}

		return output;
	}

	//

	// Nowa funkcja wypisująca strukturę drzewa z root wypisanym osobno (bez łączników)
	private printTree(root: TreeNodeDir): string {
		// Wypisz root bez prefiksu (bez łączników)
		let out = `${this.ppllm.settings.emoji ? `${root.emoji} ` : ''}${root.fileName}${!this.ppllm.settings.emoji ? '/' : ''}\n`;
		out += this.printTreeRecursive(root.files, '');
		return out;
	}

	private printTreeRecursive(nodes: TreeNode[], prefix: string): string {
		let lines: string[] = [];

		const sorted = [...nodes].sort((a, b) => {
			const aIsDir = a instanceof TreeNodeDir;
			const bIsDir = b instanceof TreeNodeDir;

			if (aIsDir === bIsDir)
				return a.fileName.localeCompare(b.fileName);
			else
				return aIsDir ? -1 : 1;
		});

		sorted.forEach((node, index) => {
			const isLast = index === sorted.length - 1;
			const connector = isLast ? '└─' : '├─';

			const line = `${prefix}${connector} ${this.ppllm.settings.emoji ? `${node.emoji} ` : ''}${node.fileName}${node instanceof TreeNodeDir && !this.ppllm.settings.emoji ? '/' : ''}`;
			lines.push(line);

			if (node instanceof TreeNodeDir && node.files.length > 0) {
				const subtree = this.printTreeRecursive(node.files, isLast ? prefix + '   ' : prefix + '│  ');
				if (subtree.trim().length > 0) {
					lines.push(subtree);
				}
			}
		});

		return lines.join('\n');
	}

	//

	private printInnerPrompts(root: TreeNodeDir, innerPrompts: InnerPromptEntity[]) {
		return (
			`${this.ppllm.settings.emoji ? `${Emoji.General.InnerPromptsHeader} ` : ''}${this.ppllm.T.innerPromptsHeader}\n\n` +
			innerPrompts
				.map(ip => {
					return (
						`${this.ppllm.settings.emoji ? `${Emoji.Files.General.Folder} ` : ''}${ip.directory} - ${this.ppllm.T.innerPromptRules}:\n\n` +
						`${ip.prompt}`
					);
				})
				.join("\n\n")
		);
	}

	//

	private collectInnerPrompts(node: TreeNodeDir, root: TreeNodeDir = node): InnerPromptEntity[] {
		let results: InnerPromptEntity[] = [];

		// Pomijamy katalog główny (root) – inner prompty tylko z zagnieżdżonych dirconfigów
		for (const child of node.files) {
			if (child instanceof TreeNodeDir) {
				if (child.dirconfig && child.dirconfig.prompt) {
					const filePathWithRoot = path.join(root.fileName, child.relativePath);

					results.push({
						directory: filePathWithRoot,
						prompt: child.dirconfig.prompt
					});
				}

				results = results.concat(this.collectInnerPrompts(child, root));
			}
		}

		return results;
	}
}