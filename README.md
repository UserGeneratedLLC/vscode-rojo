# Atlas for VS Code

Integrates [Atlas](https://github.com/UserGeneratedLLC/rojo) natively with VS Code, with full support for `.project.json5`, `.meta.json5`, and `.model.json5` files.

All actions are performed via the Atlas menu. To open the Atlas menu, either:

- Open the Command Palette (`Ctrl` + `Shift` + `P`) and type "Atlas: Open menu"
- Use the Atlas button in the bottom right corner

> Note: The Atlas button only appears if a folder in your workspace contains a `*.project.json5` or `*.project.json` file.

## Bundled Extensions

Atlas includes these recommended extensions as part of its extension pack:

- **[Better JSON5](https://marketplace.visualstudio.com/items?itemName=BlueGlassBlock.better-json5)** -- JSON5 syntax highlighting, IntelliSense, and schema validation
- **[Luau Language Server](https://marketplace.visualstudio.com/items?itemName=JohnnyMorganz.luau-lsp)** -- Full Luau language support with autocomplete, diagnostics, and type checking
- **[StyLua](https://marketplace.visualstudio.com/items?itemName=JohnnyMorganz.stylua)** -- Luau/Lua code formatter

## Automatic installation

If you do not have Atlas installed, the extension will ask you if you want it to be automatically installed for you. If you do, it will be installed via [Rokit](https://github.com/rojo-rbx/rokit), a toolchain manager. This will create a `rokit.toml` file in your project directory, which will pin the current version of Atlas in your project.

You must click "Install Roblox Studio plugin" at least once if you want to live-sync from Studio!

## System Atlas

This extension uses the `atlas.exe` from your system path. If you already installed Atlas manually to use it from the command line, or with another toolchain manager, this extension will use that version of Atlas automatically.

## JSON5 Support

Atlas fully supports `.json5` project files, meta files, and model files:

- `*.project.json5` -- Project configuration (preferred over `.project.json`)
- `*.meta.json5` -- Instance metadata (adjacent or `init.meta.json5`)
- `*.model.json5` -- JSON model instances

All file types have full JSON schema validation and IntelliSense via the bundled Better JSON5 extension.

## Help

- Read the [Atlas docs](https://rojo.space/docs/v7/)
- [Open an issue](https://github.com/UserGeneratedLLC/vscode-rojo/issues) on the project repo

## Supported platforms

- Windows
- macOS
- Linux

## License

Atlas for VS Code is available under the terms of The Mozilla Public License Version 2. See [LICENSE](LICENSE) for details.
