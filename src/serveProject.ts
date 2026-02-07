import * as vscode from "vscode"
import { State } from "./extension"
import { ProjectFile } from "./findProjectFiles"
import { updateButton } from "./updateButton"
import { formatProjectDisplayName } from "./projectDisplay"
import path = require("path")

export type RunningProject = {
  stop: () => void
  projectFile: ProjectFile
}

export function serveProject(state: State, projectFile: ProjectFile) {
  const projectFilePath = projectFile.path.fsPath

  state.context.workspaceState.update("atlasLastPath", projectFilePath)

  if (state.running[projectFilePath]) {
    throw new Error("This project is already running")
  }

  const projectFileFolder = path.dirname(projectFilePath)
  const projectFileName = path.basename(projectFilePath)

  const terminal = vscode.window.createTerminal({
    name: `Atlas: ${formatProjectDisplayName(projectFile)}`,
    cwd: projectFileFolder,
  })
  terminal.show()
  terminal.sendText(`atlas serve "${projectFileName}"`)

  // Track the terminal so we can stop it
  const disposeListener = vscode.window.onDidCloseTerminal((closedTerminal) => {
    if (closedTerminal === terminal) {
      delete state.running[projectFilePath]
      updateButton(state)
      disposeListener.dispose()
    }
  })

  state.running[projectFilePath] = {
    projectFile,
    stop() {
      terminal.dispose()
    },
  }

  updateButton(state)
}
