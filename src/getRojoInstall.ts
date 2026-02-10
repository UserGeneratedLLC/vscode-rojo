import * as childProcess from "child_process"
import { promisify } from "util"
import * as which from "which"
import { ProjectFile } from "./findProjectFiles"
import { result } from "./result"
import path = require("path")

const exec = promisify(childProcess.exec)

export enum InstallType {
  rokit = "Rokit",
  global = "global",
}
export type RojoInstall = {
  version: string
  installType: InstallType
  resolvedPath: string
}

type ExecError = {
  code: number
  stdout: string
  stderr: string
}

function getInstallType(resolvedPath: string) {
  if (resolvedPath.includes(".rokit")) {
    return InstallType.rokit
  }

  return InstallType.global
}

export async function getRojoInstall(
  projectFile: ProjectFile,
): Promise<RojoInstall | null> {
  const projectFilePath = projectFile.path.fsPath
  const projectFileFolder = path.dirname(projectFilePath)

  const resolvedPath = await which("atlas").catch(() => null)

  if (resolvedPath === null) {
    return null
  }

  const outputResult = await result<
    { stderr: string; stdout: string },
    ExecError
  >(
    exec("atlas --version", {
      cwd: projectFileFolder,
    }),
  )

  if (outputResult.ok) {
    const output = outputResult.result

    const split = output.stdout.split(" ")

    const version = split[1]

    if (!version) {
      return null
    }

    return {
      version,
      installType: getInstallType(resolvedPath),
      resolvedPath,
    }
  } else {
    if (outputResult.error.stderr.includes("rokit")) {
      return null
    }

    return Promise.reject(
      outputResult.error.stderr || outputResult.error.stdout,
    )
  }
}
