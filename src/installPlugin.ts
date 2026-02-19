import * as childProcess from "child_process"
import * as fs from "fs"
import * as os from "os"
import { promisify } from "util"
import * as vscode from "vscode"
import { ProjectFile } from "./findProjectFiles"
import path = require("path")

const exec = promisify(childProcess.exec)

const PLUGIN_FILE_NAME = "AtlasManagedPlugin.rbxm"

export function isAtlasPluginInstalled(): boolean {
  const platform = os.platform()
  let pluginPath: string | null = null

  if (platform === "win32") {
    const home = os.homedir()
    pluginPath = path.join(
      home,
      "AppData",
      "Local",
      "Roblox",
      "Plugins",
      PLUGIN_FILE_NAME,
    )
  } else if (platform === "darwin") {
    const home = os.homedir()
    pluginPath = path.join(
      home,
      "Documents",
      "Roblox",
      "Plugins",
      PLUGIN_FILE_NAME,
    )
  }

  if (!pluginPath) return false

  try {
    return fs.statSync(pluginPath).isFile()
  } catch {
    return false
  }
}

export async function installPlugin(projectFile: ProjectFile) {
  const projectFilePath = projectFile.path.fsPath
  const projectFileFolder = path.dirname(projectFilePath)

  const output = await exec(`atlas plugin install`, {
    cwd: projectFileFolder,
  })

  if (output.stderr.length > 0) {
    vscode.window.showErrorMessage(
      "Atlas plugin install failed: " + output.stderr,
    )
  } else {
    vscode.window.showInformationMessage(
      "Atlas: " +
        (output.stdout.length > 0
          ? output.stdout
          : "Roblox Studio plugin installed!"),
    )
  }
}
