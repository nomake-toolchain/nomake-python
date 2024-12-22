/**
 * @license MIT
 * @description This script provides an example about how to use the `installPython` to integrate Python into your build system without pain.
 * @author thautwarm <twshere@outlook.com>
 */
import * as NM from 'nomake'
import { installPython } from "./mod.ts";

const py = installPython({
  version: '3.10.16',
  triple: 'x86_64-pc-windows-msvc',
  buildTime: '20241219',
})

NM.target(
  {
    name: 'install-py',
    virtual: true,
    rebuild: 'always',
    deps: { py },
    build({ deps }) {
      const executablePath = NM.p`${deps.py}/python`;
      NM.Log.ok(`Python Executable is installed at ${executablePath.asPosix()}`, 'NoMake Python')
    }
  })

await NM.makefile()