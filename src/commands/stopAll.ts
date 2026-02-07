import * as vscode from "vscode"
import { State } from "../extension"

export const stopAllCommand = (state: State) =>
  vscode.commands.registerCommand("vscode-atlas.stopAll", async () => {
    for (const runningProject of Object.values(state.running)) {
      runningProject.stop()
    }
  })
