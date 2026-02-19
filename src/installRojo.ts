import * as childProcess from "child_process"
import * as fs from "fs"
import fetch from "node-fetch"
import * as os from "os"
import * as path from "path"
import * as unzipper from "unzipper"
import { promisify } from "util"
import { pipeline as pipelineCb } from "stream"
import * as vscode from "vscode"
import * as which from "which"

const exec = promisify(childProcess.exec)
const pipelineAsync = promisify(pipelineCb)

export interface GitHubRelease {
  url: string
  assets_url: string
  upload_url: string
  html_url: string
  id: number
  node_id: string
  tag_name: string
  target_commitish: string
  name: string
  draft: boolean
  prerelease: boolean
  created_at: string
  published_at: string
  assets: Asset[]
  tarball_url: string
  zipball_url: string
  body: string
}

export interface Asset {
  url: string
  id: number
  node_id: string
  name: string
  label: string
  content_type: string
  state: string
  size: number
  download_count: number
  created_at: string
  updated_at: string
  browser_download_url: string
}

async function isRokitInstalled() {
  const rokitPath = await which("rokit").catch(() => null)

  return !!rokitPath
}

const nodePlatforms: { [index: string]: string | undefined } = {
  darwin: "macos",
  linux: "linux",
  win32: "windows",
}

const nodeArches: { [index: string]: string | undefined } = {
  arm64: "aarch64",
  x64: "x86_64",
}

function findCompatibleAsset(assets: Asset[]): Asset | null {
  const currentPlatform = nodePlatforms[os.platform()]
  const currentArch = nodeArches[os.arch()]

  if (!currentPlatform || !currentArch) {
    throw new Error(
      `Your current platform is unknown. Platform: ${os.platform()}, Architecture: ${os.arch()}`,
    )
  }

  for (const asset of assets) {
    const match = asset.name.match(/-(?<platform>\w+)-(?<arch>\w+)\.zip$/)

    if (!match) {
      continue
    }

    const { platform, arch } = match.groups!

    if (platform === currentPlatform && arch === currentArch) {
      return asset
    }
  }

  return null
}

export async function installRojo(folder: string) {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Installing Atlas",
      cancellable: false,
    },
    async (progress) => {
      if (!(await isRokitInstalled())) {
        console.log("Rokit not installed")
        progress.report({ message: "Downloading Rokit..." })

        const latestReleaseResponse = await fetch(
          "https://api.github.com/repos/rojo-rbx/rokit/releases/latest",
          { headers: { Accept: "application/vnd.github+json" } },
        )

        if (!latestReleaseResponse.ok) {
          throw new Error("Could not fetch latest release from GitHub.")
        }

        const latestRelease: GitHubRelease | null =
          (await latestReleaseResponse.json()) as any

        if (!latestRelease) {
          throw new Error("Latest release of Rokit was not found")
        }

        const asset = findCompatibleAsset(latestRelease.assets)

        if (!asset) {
          throw new Error(
            `We couldn't find a compatible Rokit release for your platform/architecture: ${os.arch()} ${os.platform()}`,
          )
        }

        const download = await fetch(asset.browser_download_url)

        if (!download.ok) {
          throw new Error(
            `Response from GitHub binary download not ok: ${download.status} ${download.statusText}`,
          )
        }

        const tempPath = path.join(
          os.tmpdir(),
          "rokit" + (os.platform() === "win32" ? ".exe" : ""),
        )

        await pipelineAsync(
          download.body!,
          unzipper.ParseOne(),
          fs.createWriteStream(tempPath),
        )

        const stat = await fs.promises.stat(tempPath)
        if (stat.size === 0) {
          throw new Error(
            "Could not extract rokit executable from zip release!",
          )
        }

        if (os.platform() !== "win32") {
          await fs.promises.chmod(tempPath, 0o755)
        }

        progress.report({ message: "Installing Rokit..." })

        await exec(`"${tempPath}" self-install`)

        await fs.promises.unlink(tempPath).catch(() => {})

        vscode.window.showInformationMessage(
          "Successfully installed Rokit on your system. " +
            "It has been added to your system PATH, and is usable from the command line if needed.",
        )

        const rokitBinDir = path.join(os.homedir(), ".rokit", "bin")
        if ("PATH" in process.env) {
          const envPath = process.env.PATH!.split(path.delimiter)
          if (!envPath.includes(rokitBinDir)) {
            envPath.push(rokitBinDir)
            process.env.PATH = envPath.join(path.delimiter)
          }
        }

        const rokitCheck = await which("rokit").catch(() => null)
        if (!rokitCheck) {
          throw new Error(
            "Rokit was installed but could not be found on PATH. Please restart your editor and try again.",
          )
        }
      }

      progress.report({ message: "Installing Atlas via Rokit..." })

      await exec("rokit add --global --force UserGeneratedLLC/rojo atlas")
      await exec("rokit trust UserGeneratedLLC/rojo")
      await exec("atlas --version")

      progress.report({ message: "Installing Studio plugin..." })
      try {
        await exec("atlas plugin install")
      } catch (e: any) {
        vscode.window.showWarningMessage(
          `Atlas installed successfully, but the Studio plugin could not be installed: ${e.stderr || e}. ` +
            `You can install it later from the Atlas menu or by running "atlas plugin install".`,
        )
      }
    },
  )
}
