# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2025-04-??

### Added

- Removed multi language support in favor of handlebars templating and easier code maintaining.
- Support for other commands ('init', 'preset'). Now main usability is under 'generate' command or when no command provided

## [1.0.0] - 2025-04-02

### Added

- Initial CLI interface with `commander`
- Recursive directory scanning
- File tree formatting with emoji support
- Support for `ppllm.config.json` files with `prompt` and `ignore`
- File content extraction with size/binary handling
- Multi-language support
- Output saving to file or stdout
- Option parsing with robust error messages