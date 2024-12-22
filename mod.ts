/**
 * @file mod.ts
 * @license MIT
 * @description This module provides standalone Python build integration for the NoMake build system.
 * @author thautwarm <twshere@outlook.com>
 */
import * as NM from 'nomake';
import { unzipTarGz } from './utils.ts';

if (!NM.version || NM.SemVer.lessThan(NM.version, NM.SemVer.parse("0.1.12"))) {
    throw new Error("nomake version should be at least 0.1.12");
}

const DEFAULT_PROVIDER_REPO = 'https://github.com/astral-sh/python-build-standalone'

export type PythonBuildTriple =
    | 'aarch64-apple-darwin'
    | 'x86_64-apple-darwin'
    | 'aarch64-unknown-linux-gnu'
    | 'x86_64-pc-windows-msvc'
    | 'x86_64_v2-unknown-linux-gnu'
    | 'x86_64_v2-unknown-linux-musl'
    | 'x86_64_v3-unknown-linux-gnu'
    | 'x86_64_v3-unknown-linux-musl'
    | 'x86_64_v4-unknown-linux-gnu'
    | 'x86_64_v4-unknown-linux-musl'
    | 'armv7-unknown-linux-gnueabi'
    | 'armv7-unknown-linux-gnueabihf'

export interface PythonInstallOptions {
    /**
     * 待安装的 Python 版本
     *
     * the Python version to install
     */
    version: string;

    /**
     * 构建时间，通常格式为 '20241219'
     *
     * The build time, usually in the format '20241219'
     *
     */
    buildTime: string;

    /**
     * 提供 Python 构建的上游 Git 仓库，默认为 astral-sh/python-build-standalone。
     *      https://github.com/astral-sh/python-build-standalone
     *
     * The upstream Git repository that provides Python builds, default to
     *      https://github.com/astral-sh/python-build-standalone
     */
    repo?: string,

    triple: PythonBuildTriple,

    /**
     * 下载目录，默认为 tmp/nm-static-py
     *
     * The download directory, default to `tmp/nm-static-py`
     */
    downloadDir?: string
}

export function computeDownloadUrl(options: PythonInstallOptions): string {
    const repo = options.repo ?? DEFAULT_PROVIDER_REPO;
    return `${repo}/releases/download/${options.buildTime}/cpython-${options.version}+${options.buildTime}-${options.triple}-install_only.tar.gz`;
}

export function computePyCatalogDir(options: PythonInstallOptions): NM.Path {
    const root = options.downloadDir ?? 'tmp';
    return NM.p`${root}/nm-static-py/`
}

export function computeUniquePyDistName(options: PythonInstallOptions): string {
    return `cpython-${options.version}+${options.buildTime}-${options.triple}`;
}


export function installPython(opts: PythonInstallOptions) {
    const url = computeDownloadUrl(opts);
    const installDir = computePyCatalogDir(opts);
    const distName = computeUniquePyDistName(opts);
    const filename = `${distName}.tar.gz`;
    const targetStr = NM.p`${installDir}/${filename}`;

    const mkdir = () => installDir.mkdir({ parents: true, onError: 'existOk' });;

    const versionStampFile = NM.target(
        {
            name: installDir.join("version-stamp").asPosix(),
            rebuild: "always",
            async build({ target }) {
                await mkdir();
                await new NM.Path(target).writeText(distName)
                NM.Log.info(`written to ${target}: ${distName}`, 'Version Stamp')
            }
        }
    )

    const resource = NM.target(
        {
            name: targetStr.asPosix(),
            deps: { versionStampFile },
            doc: `Download ${url}`,
            async build({ target }) {
                await mkdir();
                const targetPath = new NM.Path(target);
                await NM.Web.download({ url, path: targetPath });
                NM.Log.ok(`Python is downloaded to ${target}`, 'Web Download')
            },
        },
    );

    const staticPyBuild = NM.target(
        {
            name: installDir.join(distName).asPosix(),
            deps: { resource },
            async build({ deps, target }) {
                await mkdir();
                await unzipTarGz(deps.resource, target)
                NM.Log.ok(`Python download is extracted to ${target}`, 'Zit')
            }
        }
    )

    return NM.target({
        // The directory 'python' must be the directory where python executable is located.
        // Such fact is specified according to:
        //      https://gregoryszorc.com/docs/python-build-standalone/main/distributions.html#install-only-archive
        name: installDir.join(distName, 'python').asPosix(),
        deps: [staticPyBuild],
        virtual: true,
        build({ target }) {
            NM.Log.ok(`Python is installed in ${target}`, 'InstallPython')
        }
    })
}