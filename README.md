# nomake python

Introduce Python to your build system without pain.

## Usage

The usage is easy, a build target as follow can be referenced by any other
NoMake targets:

```typescript
const py = installPython({
    version: "3.10.16",
    triple: "x86_64-pc-windows-msvc",
    buildTime: "20241219",
});
```

TypeScript's autocompletion will instruct you how to select the correct version and triple, or where to find these parameters. Basically, these information comes from https://github.com/astral-sh/python-build-standalone/releases.

A whole example is given at `example.ts`, which can be run by
`deno run -A example.ts install-py`:

```typescript
import * as NM from "nomake";
import { installPython } from "./mod.ts";

const py = installPython({
    version: "3.10.16",
    triple: "x86_64-pc-windows-msvc",
    buildTime: "20241219",
});

NM.target(
    {
        name: "install-py",
        virtual: true,
        rebuild: "always",
        deps: { py },
        build({ deps }) {
            const executablePath = NM.p`${deps.py}/python`;
            NM.Log.ok(
                `Python Executable is installed at ${executablePath.asPosix()}`,
                "NoMake Python",
            );
        },
    },
);

await NM.makefile();
```

## License

NoMake-Python is licensed under the MIT License. See LICENSE for more information.
