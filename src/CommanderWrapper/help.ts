import * as colorette from 'colorette';

import * as Types from "./types.js";

//

export function generateGlobalHelpText(commands: Map<string, Types.CommandMeta>): string {
    const lines: string[] = [];

    //

    lines.push(colorette.bold(`\nAvailable Commands:\n`));

    for (const [commandName, commandMeta] of commands.entries()) {
        const description = commandMeta.commander.description() || '';

        lines.push(`  ${colorette.cyan(commandName)}`);

        if (description.trim() !== '')
            lines.push(`    ${description}`);

        lines.push('');
    }

    lines.push(`${colorette.green('Tip')}: For detailed options, use ${colorette.cyan('<command> --help')}\n`);

    //

    return lines.join('\n');
}

export function generateHelpTextForCommand(commandName: string, commandMeta: Types.CommandMeta): string {
    const lines: string[] = [];

    //

    if (commandMeta.arguments.length > 0) {
        lines.push(colorette.underline('Arguments:') + '\n');
    
        for (const arg of commandMeta.arguments)
            lines.push(`  ${colorette.cyan(arg.config.name)}${arg.config.required ? colorette.red(' (required)') : ''}`);
    
        lines.push('');
    }

    //

    lines.push(colorette.bold(`\nOptions for command: ${colorette.cyan(commandName)}\n`));

    //

    const groups = Object.entries(commandMeta.groups);

    if (groups.length === 0) {
        lines.push(colorette.yellow('No options available for this command.\n'));
        return lines.join('\n');
    }

    //

    groups.unshift(["built-in", [{
        groupName: "built-in",

        flags: "-h, --help",
        description: "Show help",
        tags: [],

        commanderOption: null as any
    }]]);

    //

    const allOptions = groups.flatMap(([, options]) => options);
    const flagPadding = Math.max(...allOptions.map(opt => opt.flags.length)) + 2;

    for (const [groupName, options] of groups) {
        lines.push(colorette.underline(`${groupName}:`) + "\n");

        for (const option of options) {
            const flags = colorette.cyan(option.flags.padEnd(flagPadding));
            lines.push(`  ${flags} ${option.description}`);
        }

        lines.push('');
    }

    lines.push('');

    //

    return lines.join('\n');
}
