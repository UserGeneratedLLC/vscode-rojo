import * as vscode from "vscode"
import * as cp from "child_process"
import { State } from "./extension"
import { ProjectFile } from "./findProjectFiles"
import { updateButton } from "./updateButton"
import { formatProjectDisplayName } from "./projectDisplay"
import path = require("path")

export type RunningProject = {
  stop: () => void
  projectFile: ProjectFile
}

class ServeTerminal implements vscode.Pseudoterminal {
  private writeEmitter = new vscode.EventEmitter<string>()
  private closeEmitter = new vscode.EventEmitter<number | void>()

  onDidWrite = this.writeEmitter.event
  onDidClose = this.closeEmitter.event

  private process?: cp.ChildProcess

  constructor(
    private cwd: string,
    private projectFileName: string,
    private onProcessExit: () => void,
  ) {}

  open(): void {
    this.process = cp.spawn("atlas", ["serve", this.projectFileName], {
      cwd: this.cwd,
    })

    this.process.stdout?.on("data", (data: Buffer) => {
      this.writeEmitter.fire(data.toString().replace(/\r?\n/g, "\r\n"))
    })

    this.process.stderr?.on("data", (data: Buffer) => {
      this.writeEmitter.fire(data.toString().replace(/\r?\n/g, "\r\n"))
    })

    this.process.on("exit", (code) => {
      this.writeEmitter.fire(
        `\r\n\x1b[2mProcess exited with code ${code}\x1b[0m\r\n`,
      )
      this.onProcessExit()
    })

    this.process.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") {
        this.writeEmitter.fire(
          `\r\n\x1b[31mCould not find 'atlas' on PATH. Is it installed?\x1b[0m\r\n`,
        )
      } else {
        this.writeEmitter.fire(
          `\r\n\x1b[31mFailed to start process: ${err.message}\x1b[0m\r\n`,
        )
      }
      this.onProcessExit()
    })
  }

  close(): void {
    this.process?.kill()
  }

  handleInput(data: string): void {
    if (data === "\x03") {
      this.process?.kill()
    } else {
      this.process?.stdin?.write(data)
    }
  }
}

export function serveProject(state: State, projectFile: ProjectFile) {
  const projectFilePath = projectFile.path.fsPath

  state.context.workspaceState.update("atlasLastPath", projectFilePath)

  if (state.running[projectFilePath]) {
    throw new Error("This project is already running")
  }

  const projectFileFolder = path.dirname(projectFilePath)
  const projectFileName = path.basename(projectFilePath)

  const cleanupProject = () => {
    if (projectFilePath in state.running) {
      delete state.running[projectFilePath]
      updateButton(state)
    }
  }

  const pty = new ServeTerminal(
    projectFileFolder,
    projectFileName,
    cleanupProject,
  )

  const terminal = vscode.window.createTerminal({
    name: `Atlas: ${formatProjectDisplayName(projectFile)}`,
    pty,
  })
  terminal.show()

  // Also clean up when the terminal UI is closed
  const disposeListener = vscode.window.onDidCloseTerminal((closedTerminal) => {
    if (closedTerminal === terminal) {
      cleanupProject()
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
