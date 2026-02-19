import * as childProcess from "child_process"
import { promisify } from "util"
import * as vscode from "vscode"
import * as which from "which"

const exec = promisify(childProcess.exec)

const ONE_DAY = 24 * 60 * 60 * 1000

export async function checkForAtlasUpdates(
  context: vscode.ExtensionContext,
): Promise<void> {
  const lastCheck = context.globalState.get<number>("atlas::lastUpdateCheck")
  if (lastCheck && Date.now() - lastCheck < ONE_DAY) return

  const rokitPath = await which("rokit").catch(() => null)
  if (!rokitPath) return

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath

  let checkOutput: string | null = null
  let updateScope: "project" | "global" = "global"

  if (workspaceFolder) {
    try {
      const result = await exec("rokit update atlas --check", {
        cwd: workspaceFolder,
      })
      const output = (result.stdout + result.stderr).trim()
      if (output && !output.toLowerCase().includes("up to date")) {
        checkOutput = output
        updateScope = "project"
      }
    } catch {
      // atlas not in project rokit.toml -- fall through
    }
  }

  if (!checkOutput) {
    try {
      const result = await exec("rokit update --global atlas --check")
      const output = (result.stdout + result.stderr).trim()
      if (output && !output.toLowerCase().includes("up to date")) {
        checkOutput = output
        updateScope = "global"
      }
    } catch {
      // atlas not installed globally via rokit
    }
  }

  context.globalState.update("atlas::lastUpdateCheck", Date.now())

  if (!checkOutput) return

  const choice = await vscode.window.showInformationMessage(
    `An Atlas update is available. ${checkOutput}`,
    "Update",
    "Dismiss",
  )

  if (choice !== "Update") return

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Updating Atlas...",
    },
    async (progress) => {
      try {
        if (updateScope === "project" && workspaceFolder) {
          await exec("rokit update atlas", { cwd: workspaceFolder })
        } else {
          await exec("rokit update --global atlas")
        }
      } catch (e: any) {
        vscode.window.showErrorMessage(
          `Could not update Atlas: ${e.stderr || e}`,
        )
        return
      }

      progress.report({ message: "Reinstalling Studio plugin..." })
      try {
        await exec("atlas plugin install")
      } catch {
        vscode.window.showWarningMessage(
          "Atlas updated, but Studio plugin reinstall failed. " +
            'Run "atlas plugin install" manually.',
        )
      }

      vscode.window.showInformationMessage("Atlas updated successfully.")
    },
  )
}
