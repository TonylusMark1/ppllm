#!/usr/bin/env node

// src/index.ts
import CommanderWrapper from "commanderwrapper";

// src/global/consts.ts
var REGEXP_FILENAME = /^[^\\/\\0]+(?:\.[a-zA-Z0-9_\-]+)?$/;
var REGEXP_DIRECTORY_PATH = /^(?:\.{1,2}|(?:\.{0,2}[\\/])?(?:[^\\/\\0]+(?:[\\/]|$))+)$/;
var DEFAULT_DIRCONFIG_FILENAME = "ppllm.dirconfig.json";
var DEFAULT_SETTINGS_FILENAME = "ppllm.settings.json";
var DEFAULT_OUTPUT_FILENAME = "ppllm.prompt.txt";

// src/commands/Generate/index.ts
import path5 from "path";
import fs4 from "fs";
import process2 from "process";
import { Minimatch } from "minimatch";

// src/global/emoji.ts
var EmojisForExtensions = {
  "jpeg,jpg,png,bmp,gif": "\u{1F5BC}\uFE0F",
  "csv,xlsx": "\u{1F4CA}",
  //"js,ts,py,java,c,cpp,h,html,css,json,xml": "📜",
  "mp3,wav": "\u{1F3B5}",
  "mp4,avi": "\u{1F3AC}"
};
var General = {
  FileStructure: "\u{1F333}",
  InnerPromptsHeader: "\u{1F9E0}",
  FileContents: "\u{1F4DA}",
  Error: "\u274C",
  Success: "\u2705",
  Saved: "\u{1F4BE}"
};
var Files = {
  General: {
    AnyNonBinaryFile: "\u{1F4C4}",
    AnyBinaryFile: "\u{1F4E6}",
    EmptyFolder: "\u{1F4C1}",
    Folder: "\u{1F4C2}"
  },
  PerExt: Object.fromEntries(
    Object.entries(EmojisForExtensions).map((entry) => {
      const key = entry[0];
      const val = entry[1];
      const exts = key.split(/\s*[,;]\s*/g);
      return exts.map((ext) => [ext, val]);
    }).flat()
  )
};

// src/helpers/utils.ts
import path from "path";
import url from "url";
import { fileTypeFromFile } from "file-type";
import { isBinaryFile } from "isbinaryfile";
import slash from "slash";
var __filename = url.fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function getProjectRoot() {
  if (true) {
    return path.resolve(__dirname, "..");
  }
  const currentDirectory = path.dirname(url.fileURLToPath(import.meta.url));
  return path.resolve(currentDirectory, "../../");
}
function ConvertPathToPOSIX(path9) {
  return slash(path9);
}
function ConvertSizeToBytes(input) {
  const match = /^(\d+) *(B|KB|MB|GB)?$/i.exec(input);
  if (!match)
    throw new Error(`Invalid max size value: ${input}`);
  const number = parseInt(match[1], 10);
  const unit = (match[2] || "B").toUpperCase();
  let multiplier = 1;
  switch (unit) {
    case "B":
      multiplier = 1;
      break;
    case "KB":
      multiplier = 1024;
      break;
    case "MB":
      multiplier = 1024 * 1024;
      break;
    case "GB":
      multiplier = 1024 * 1024 * 1024;
      break;
    default:
      multiplier = 1;
  }
  return number * multiplier;
}
async function IsFileBinary(filePath) {
  const type = await fileTypeFromFile(filePath);
  if (type) {
    if (type?.mime.startsWith("text/"))
      return false;
    return true;
  }
  return await isBinaryFile(filePath);
}

// src/commands/Generic.ts
var CommandGeneric = class {
  static get Name() {
    throw new Error(`Command class ${this.name} hasn't Name overloaded.`);
  }
  static get Description() {
    throw new Error(`Command class ${this.name} hasn't Description overloaded.`);
  }
  static Arguments() {
    return [];
  }
  static Options(option, ppllm2) {
  }
  //
  ppllm;
  o;
  //
  constructor(ppllm2) {
    this.ppllm = ppllm2;
    this.o = this.ppllm.cmderw.getOptions();
  }
  //
  start() {
    throw new Error("Unimplemented");
  }
};

// src/commands/Generate/Templates.ts
import path2 from "path";
import fs from "fs";
import Handlebars from "handlebars";
var Templates = class {
  static DIRECTORY = path2.resolve(getProjectRoot(), `./assets/templates`);
  static SUFFIX = ".prompt.hbs";
  static List;
  static Default = "eng";
  static {
    this.List = (() => {
      const files = fs.readdirSync(this.DIRECTORY);
      return files.filter((f) => f.endsWith(this.SUFFIX)).map((f) => f.split(".")[0]);
    })();
    if (!this.Exists(this.Default))
      throw new Error(`Default template '${this.Default}' doesn't exist.`);
  }
  //
  static Exists(name) {
    return this.List.includes(name);
  }
  //
  static Load(template) {
    const existsInBuiltIn = this.Exists(template);
    const templatePath = (() => {
      if (existsInBuiltIn)
        return path2.resolve(this.DIRECTORY, `${template}${this.SUFFIX}`);
      return path2.resolve(process.cwd(), template);
    })();
    try {
      const content = fs.readFileSync(templatePath, "utf-8");
      return Handlebars.compile(content);
    } catch (err) {
      if (existsInBuiltIn)
        throw err;
      throw new Error(
        `Template "${template}" does not exist as a built-in template or as a local file at "${templatePath}". Ensure the file exists and is readable.`
      );
    }
  }
};

// src/commands/Generate/PromptGenerator.ts
import fs2 from "fs";
import path3 from "path";

// src/commands/Generate/TreeNode.ts
var TreeNode = class {
  static Flatten(nodes) {
    let result = [];
    for (const node of nodes) {
      if (node instanceof TreeNodeDir && node.files.length > 0) {
        result = result.concat(this.Flatten(node.files));
      } else if (node instanceof TreeNodeFile) {
        result.push(node);
      }
    }
    return result;
  }
  //
  relativePath;
  absolutePath;
  fileName;
  //
  constructor(relativePath, absolutePath, fileName) {
    this.relativePath = relativePath;
    this.absolutePath = absolutePath;
    this.fileName = fileName;
  }
  //
  get emoji() {
    throw new Error("Unimplemented");
  }
};
var TreeNodeDir = class extends TreeNode {
  files = [];
  dirconfig;
  //
  constructor(relativePath, absolutePath, fileName, dirconfig) {
    super(relativePath, absolutePath, fileName);
    this.dirconfig = dirconfig;
  }
  //
  get isEmptyDir() {
    return this.files?.length === 0;
  }
  get emoji() {
    return this.isEmptyDir ? Files.General.EmptyFolder : Files.General.Folder;
  }
};
var TreeNodeFile = class extends TreeNode {
  isBinary;
  //
  constructor(relativePath, absolutePath, fileName, isBinary = false) {
    super(relativePath, absolutePath, fileName);
    this.isBinary = isBinary;
  }
  //
  get ext() {
    const idx = this.fileName.lastIndexOf(".");
    if (idx === -1 || idx === this.fileName.length - 1)
      return null;
    return this.fileName.slice(idx + 1).toLowerCase();
  }
  get emoji() {
    let emoji = "";
    if (this.ext && Files.PerExt[this.ext]) {
      emoji = Files.PerExt[this.ext];
    } else {
      emoji = this.isBinary ? Files.General.AnyBinaryFile : Files.General.AnyNonBinaryFile;
    }
    return emoji;
  }
};

// src/commands/Generate/PromptGenerator.ts
var PromptGenerator = class {
  parent;
  //
  constructor(parent) {
    this.parent = parent;
  }
  //
  async generate(root) {
    const template = Templates.Load(this.parent.settings.template);
    const fileTree = this.parent.treePrinter.print(root);
    const innerPrompts = this.collectInnerPrompts(root);
    const files = await this.collectFiles(root);
    if (this.parent.ppllm.settingsHandler.settings.emoji) {
      for (const innerPrompt of innerPrompts) {
        const emoji = innerPrompt.directoryIsEmpty ? Files.General.EmptyFolder : Files.General.Folder;
        innerPrompt.directory = `${emoji} ${innerPrompt.directory}`;
      }
      for (const file of files) {
        const ext = path3.extname(file.path);
        const emoji = Files.PerExt[ext] ?? (file.isBinary ? Files.General.AnyNonBinaryFile : Files.General.AnyBinaryFile);
        file.path = `${emoji} ${file.path}`;
      }
    }
    const data = {
      fileTree,
      innerPrompts,
      files
    };
    return template(data);
  }
  //
  collectInnerPrompts(node, root = node) {
    let results = [];
    for (const child of node.files) {
      if (child instanceof TreeNodeDir) {
        if (child.dirconfig?.prompt) {
          const filePathWithRoot = path3.join(root.fileName, child.relativePath);
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
  async collectFiles(root) {
    const flatFiles = TreeNode.Flatten(root.files);
    flatFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    const fileContentMaxSizeInBytes = (() => {
      if (this.parent.settings.maxSize === "disable")
        return void 0;
      return ConvertSizeToBytes(this.parent.settings.maxSize);
    })();
    const files = [];
    for (const file of flatFiles) {
      if (file.isBinary && this.parent.settings.binary !== "all")
        continue;
      const templateFile = {
        path: path3.join(root.fileName, file.relativePath),
        isBinary: file.isBinary,
        exception: false,
        content: ""
      };
      try {
        const stats = await fs2.promises.stat(file.absolutePath);
        if (file.isBinary) {
          templateFile.content = `File is binary and was not loaded`;
          templateFile.exception = true;
        } else if (fileContentMaxSizeInBytes && stats.size > fileContentMaxSizeInBytes) {
          templateFile.content = `File is too large and was not loaded`;
          templateFile.exception = true;
        } else {
          templateFile.content = await fs2.promises.readFile(file.absolutePath, "utf8");
        }
      } catch (err) {
        templateFile.content = `File read error: ${err}`;
        templateFile.exception = true;
        console.log(templateFile.content);
      }
      files.push(templateFile);
    }
    return files;
  }
};

// src/commands/Generate/TreePrinter.ts
var TreePrinter = class {
  parent;
  //
  constructor(parent) {
    this.parent = parent;
  }
  //
  print(root) {
    let out = `${this.parent.ppllm.settingsHandler.settings.emoji ? `${root.emoji} ` : ""}${root.fileName}${!this.parent.ppllm.settingsHandler.settings.emoji ? "/" : ""}
`;
    out += this.printTreeRecursive(root.files, "");
    return out;
  }
  printTreeRecursive(nodes, prefix) {
    let lines = [];
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
      const connector = isLast ? "\u2514\u2500" : "\u251C\u2500";
      const line = `${prefix}${connector} ${this.parent.ppllm.settingsHandler.settings.emoji ? `${node.emoji} ` : ""}${node.fileName}${node instanceof TreeNodeDir && !this.parent.ppllm.settingsHandler.settings.emoji ? "/" : ""}`;
      lines.push(line);
      if (node instanceof TreeNodeDir && node.files.length > 0) {
        const subtree = this.printTreeRecursive(node.files, isLast ? prefix + "   " : prefix + "\u2502  ");
        if (subtree.trim().length > 0) {
          lines.push(subtree);
        }
      }
    });
    return lines.join("\n");
  }
};

// src/commands/Generate/TreeScanner.ts
import path4 from "path";
import { promises as fs3 } from "fs";
var TreeScanner = class {
  parent;
  //
  constructor(parent) {
    this.parent = parent;
  }
  //
  async scanDir(dir, matchers) {
    const dirConfigPath = path4.join(dir, this.parent.ppllm.settingsHandler.settings.dirconfig);
    const dirconfig = this.parent.ppllm.dirConfigHandler.read(dirConfigPath);
    const newPatterns = dirconfig?.ignore ?? [];
    const combinedMatchers = matchers.concat(this.parent.buildIgnoreMatchers(this.parent.absoluteSourceDirectory, dir, newPatterns));
    const absPath = path4.resolve(dir);
    const relativePath = path4.relative(this.parent.absoluteSourceDirectory, absPath) || ".";
    const node = new TreeNodeDir(relativePath, absPath, path4.basename(dir), dirconfig);
    const items = await fs3.readdir(dir, { withFileTypes: true });
    for (const item of items) {
      const itemPath = path4.join(dir, item.name);
      const itemAbsPath = path4.resolve(itemPath);
      if (item.name === this.parent.o.dirconfig || item.name == this.parent.o.settings)
        continue;
      if (this.parent.absoluteOutputPath && itemAbsPath === this.parent.absoluteOutputPath)
        continue;
      if (this.isIgnored(itemAbsPath, combinedMatchers))
        continue;
      if (item.isDirectory()) {
        const childDir = await this.scanDir(itemPath, combinedMatchers);
        node.files.push(childDir);
      } else if (item.isFile()) {
        const isBinary = await IsFileBinary(itemAbsPath);
        if (this.parent.settings.binary === "none" && isBinary)
          continue;
        node.files.push(new TreeNodeFile(
          path4.relative(this.parent.absoluteSourceDirectory, itemAbsPath),
          itemAbsPath,
          item.name,
          isBinary
        ));
      }
    }
    return node;
  }
  //
  isIgnored(itemPath, matchers) {
    const relativePath = path4.relative(this.parent.absoluteSourceDirectory, itemPath);
    const posix = ConvertPathToPOSIX(relativePath);
    return matchers.some((m) => m.match(posix));
  }
};

// src/commands/Generate/index.ts
var CommandGenerate = class extends CommandGeneric {
  static get Name() {
    return "generate";
  }
  static get Description() {
    return "Generate prompt";
  }
  static Options(option, ppllm2) {
    option(
      { groupName: "general" },
      {
        flags: "-d, --dir <dir>",
        description: "Source directory to scan.",
        defaultValue: ".",
        validation: [{ pattern: REGEXP_DIRECTORY_PATH, description: "directory path" }]
      }
    );
    option(
      { groupName: "general" },
      {
        flags: "-o, --output <mode>",
        description: `Output mode, default is file.`,
        defaultValue: "file",
        validation: ["stdout", "file"],
        valueParser: (x) => x.toLowerCase()
      }
    );
    option(
      { groupName: "settings" },
      {
        flags: "-t, --template <template>",
        description: `Handlebars template used to generate prompt.`,
        defaultValue: Templates.Default,
        validation: [...Templates.List, { pattern: REGEXP_FILENAME, description: "filename string" }]
      }
    );
    option(
      { groupName: "settings" },
      {
        flags: "-f, --file <filename>",
        description: `Filename for output file.`,
        defaultValue: DEFAULT_OUTPUT_FILENAME,
        validation: [{ pattern: REGEXP_FILENAME, description: "filename string" }]
      }
    );
    option(
      { groupName: "settings" },
      {
        flags: "-p, --preset <preset>",
        description: "Preset of ignore list to use",
        defaultValue: "disable",
        validation: ["disable", "general", ...ppllm2.presetLoader.list],
        valueParser: (x) => x.toLowerCase()
      }
    );
    option(
      { groupName: "settings" },
      {
        flags: "-m, --max-size <size>",
        description: "Set maximum file size to load.",
        defaultValue: "disable",
        validation: ["disable", { pattern: /^[0-9]+(KB|MB|GB)$/i, description: "e.g. 100KB, 5MB, 1GB" }],
        valueParser: (x) => x.toLowerCase()
      }
    );
    option(
      { groupName: "settings" },
      {
        flags: "-b, --binary <mode>",
        description: `Binary file mode.`,
        defaultValue: "tree",
        validation: ["none", "tree", "all"],
        valueParser: (x) => x.toLowerCase()
      }
    );
  }
  //
  absoluteSourceDirectory;
  absoluteOutputPath;
  treeScanner = new TreeScanner(this);
  treePrinter = new TreePrinter(this);
  promptGenerator = new PromptGenerator(this);
  //
  constructor(ppllm2) {
    super(ppllm2);
    this.absoluteSourceDirectory = path5.resolve(process2.cwd(), this.o.dir);
    this.absoluteOutputPath = path5.resolve(process2.cwd(), this.settings.file);
  }
  //
  get settings() {
    return this.ppllm.settingsHandler.settings;
  }
  //
  async start() {
    try {
      const presetMatchers = await this.getIgnorePresetMatchers();
      const dirNode = await this.treeScanner.scanDir(this.absoluteSourceDirectory, presetMatchers);
      const prompt = await this.promptGenerator.generate(dirNode);
      this.outputResult(prompt);
    } catch (err) {
      console.error(`${this.ppllm.settingsHandler.settings.emoji ? `${General.Error} ` : ""} Error:`, err);
    }
  }
  //
  async getIgnorePresetMatchers() {
    if (this.settings.preset == "disable")
      return [];
    const presetPatterns = (await this.ppllm.presetLoader.loadPreset(this.settings.preset)).map((p) => path5.resolve(this.absoluteSourceDirectory, p));
    return this.buildIgnoreMatchers(this.absoluteSourceDirectory, this.absoluteSourceDirectory, presetPatterns);
  }
  buildIgnoreMatchers(rootDir, dir, ignorePatterns) {
    return ignorePatterns.map((p) => {
      const patternAbsolute = path5.resolve(dir, p);
      const relativeToRoot = path5.relative(rootDir, patternAbsolute);
      const pattern = ConvertPathToPOSIX(relativeToRoot);
      return new Minimatch(pattern, {
        dot: true,
        matchBase: false
      });
    });
  }
  //
  outputResult(prompt) {
    if (this.o.output == "stdout") {
      process2.stdout.write(prompt, "utf8");
    } else {
      fs4.writeFileSync(this.absoluteOutputPath, prompt, "utf8");
      const relPath = path5.relative(process2.cwd(), this.absoluteOutputPath);
      const displayPath = relPath.startsWith("..") ? this.absoluteOutputPath : `./${relPath}`;
      console.log(`${this.ppllm.settingsHandler.settings.emoji ? `${General.Saved} ` : ""}Prompt generated and saved to file: ${displayPath}`);
    }
  }
};

// src/commands/Preset/index.ts
var CommandPreset = class extends CommandGeneric {
  static get Name() {
    return "preset";
  }
  static get Description() {
    return "Prints choosen built-in preset";
  }
  static Arguments() {
    return [
      {
        name: "name",
        required: true,
        validation: [/^[a-z0-9_\-]+$/i]
      }
    ];
  }
  //
  constructor(ppllm2) {
    super(ppllm2);
  }
  //
  async start() {
    const presetName = this.ppllm.cmderw.getCommandArguments().name;
    try {
      const preset = await this.ppllm.presetLoader.loadPresetFile(presetName);
      console.log(`Built-in '${presetName}' preset:
`);
      console.log(JSON.stringify(preset, void 0, 2));
    } catch (err) {
      console.error(`${this.ppllm.settingsHandler.settings.emoji ? `${General.Error} ` : ""} Error: ` + err.messages);
    }
  }
};

// src/DirConfigHandler.ts
import path6 from "path";
import fs5 from "fs";
var DirConfigHandler = class {
  ppllm;
  //
  constructor(ppllm2) {
    this.ppllm = ppllm2;
  }
  //
  read(dircfgPath) {
    const directory = path6.dirname(dircfgPath);
    try {
      const content = fs5.readFileSync(dircfgPath, "utf8");
      const dirconfig = JSON.parse(content);
      if (Array.isArray(dirconfig.ignore))
        dirconfig.ignore = dirconfig.ignore.map((p) => path6.resolve(directory, p));
      return dirconfig;
    } catch {
      return void 0;
    }
  }
};

// src/PresetLoader.ts
import path7 from "path";
import fs6 from "fs";
var PresetLoader = class _PresetLoader {
  static DIRECTORY = path7.resolve(getProjectRoot(), `./assets/presets/ignore`);
  static GENERAL_PRESET_NAME = "_general";
  static SUFFIX = ".ignore.json";
  //
  list;
  //
  constructor() {
    this.list = (() => {
      const files = fs6.readdirSync(_PresetLoader.DIRECTORY);
      return files.filter((f) => f.endsWith(_PresetLoader.SUFFIX) && !f.startsWith(_PresetLoader.GENERAL_PRESET_NAME)).map((f) => f.split(".")[0]);
    })();
  }
  //
  async loadPreset(presetName) {
    const all = [];
    all.push(
      ...await this.loadPresetFile(_PresetLoader.GENERAL_PRESET_NAME)
    );
    presetName !== "general" && all.push(
      ...await this.loadPresetFile(presetName)
    );
    return all;
  }
  //
  async loadPresetFile(name) {
    if (!this.list.includes(name) && name != _PresetLoader.GENERAL_PRESET_NAME)
      throw new Error(`Built-in preset '${name}' doesn't exist.`);
    const fullPath = path7.join(_PresetLoader.DIRECTORY, `${name}.ignore.json`);
    const raw = await fs6.promises.readFile(fullPath, "utf8");
    return JSON.parse(raw);
  }
};

// src/SettingsHandler.ts
import path8 from "path";
import fs7 from "fs";
var SettingsHandler = class {
  static RegisterOptions(option) {
    option(
      { groupName: "settings" },
      {
        flags: "-c, --dirconfig <filename>",
        description: "Name of the dirconfig file.",
        defaultValue: DEFAULT_DIRCONFIG_FILENAME,
        validation: [{ pattern: REGEXP_FILENAME, description: "filename string" }]
      }
    );
    option(
      { groupName: "settings" },
      {
        flags: "-e, --emoji",
        description: `Render emoji in prompt and messages.`,
        defaultValue: false
      }
    );
  }
  //
  ppllm;
  settings;
  userSettings;
  //
  constructor(ppllm2) {
    this.ppllm = ppllm2;
    ({ settings: this.settings, userSettings: this.userSettings } = this.init());
  }
  //
  getOptions(onlyUserProvided) {
    return this.ppllm.cmderw.getOptions({
      groupName: "settings",
      onlyUserProvided: onlyUserProvided ?? false
    });
  }
  //
  init() {
    const fromFile_settings = this.readSettingsFile();
    const fromCLI_settings = this.getOptions();
    const fromCLI_userProvidedSettings = this.getOptions(true);
    const userSettings = Object.fromEntries(
      Object.keys(fromCLI_settings).map((key) => {
        return [
          key,
          fromCLI_userProvidedSettings[key] ?? fromFile_settings[key] ?? void 0
        ];
      })
    );
    const settings = Object.fromEntries(
      Object.keys(fromCLI_settings).map((key) => {
        return [
          key,
          userSettings[key] ?? fromCLI_settings[key]
        ];
      })
    );
    for (const key in fromFile_settings) {
      const val = fromFile_settings[key];
      const valid = this.ppllm.cmderw.isOptionValueValid(key, val);
      if (valid === false) {
        console.error(`${settings.emoji ? `${General.Error} ` : ""}Invalid setting value in settings file: '${key}' can't be ${JSON.stringify(val)}`);
        process.exit(-1);
      }
    }
    return { settings, userSettings };
  }
  //
  storeUserSettings() {
    if (Object.keys(this.getOptions(true)).length) {
      const savedTo = this.storeSettingsFile(this.userSettings);
      const savedToRel = path8.relative(process.cwd(), savedTo);
      console.log(`${this.settings.emoji ? `${General.Saved} ` : ""}Settings saved to: ${savedToRel}`);
    } else {
      console.log(`${this.settings.emoji ? `${General.Saved} ` : ""}No new settings to save`);
    }
  }
  //
  readSettingsFile() {
    const settingsPath = path8.join(process.cwd(), this.ppllm.o.settings);
    try {
      const content = fs7.readFileSync(settingsPath, "utf8");
      const settings = JSON.parse(content);
      return settings;
    } catch {
      return {};
    }
  }
  storeSettingsFile(settings) {
    const settingsPath = path8.resolve(process.cwd(), this.ppllm.o.settings);
    fs7.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");
    return settingsPath;
  }
};

// src/index.ts
var PPLLM = class _PPLLM {
  static CommandsSet = /* @__PURE__ */ new Set();
  static DefaultCommand = CommandGenerate;
  static {
    this.CommandsSet.add(CommandGenerate);
    this.CommandsSet.add(CommandPreset);
  }
  //
  dirConfigHandler;
  cmderw;
  o;
  settingsHandler;
  command;
  presetLoader = new PresetLoader();
  //
  constructor() {
    this.dirConfigHandler = new DirConfigHandler(this);
    this.cmderw = new CommanderWrapper();
    this.initCommands();
    this.cmderw.parse();
    this.o = this.cmderw.getOptions();
    this.settingsHandler = new SettingsHandler(this);
    if (this.o.store)
      this.settingsHandler.storeUserSettings();
    const commandName = this.cmderw.getUsedCommand();
    const commandClass = Array.from(_PPLLM.CommandsSet).find((Class) => Class.Name == commandName);
    if (!commandClass)
      throw new Error(`Couldn't find class bound to '${commandName}' command.`);
    this.command = new commandClass(this);
  }
  //
  initCommands() {
    _PPLLM.CommandsSet.forEach((ClassOfCommand) => {
      this.cmderw.registerCommand(
        ClassOfCommand.Name,
        ClassOfCommand.Description,
        {
          isDefault: ClassOfCommand == _PPLLM.DefaultCommand,
          arguments: ClassOfCommand.Arguments()
        },
        (option) => {
          this.registerOptions(option);
          SettingsHandler.RegisterOptions(option);
          ClassOfCommand.Options(option, this);
        }
      );
    });
  }
  //
  async start() {
    await this.command?.start();
  }
  //
  registerOptions(option) {
    option(
      { groupName: "general" },
      {
        flags: "-S, --settings <filename>",
        description: "Name of the settings file.",
        defaultValue: DEFAULT_SETTINGS_FILENAME,
        validation: [{ pattern: REGEXP_FILENAME, description: "filename string" }]
      }
    );
    option(
      { groupName: "general" },
      {
        flags: "-s, --store",
        description: "Store used settings into file in cwd.",
        defaultValue: false
      }
    );
  }
};
var ppllm = new PPLLM();
ppllm.start();
export {
  PPLLM as default
};
//# sourceMappingURL=index.js.map