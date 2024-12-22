/**
 * @file mod.ts
 * @license MIT
 * @description This utility module provides a function to unzip a tar.gz file under Pure Deno.
 * @author thautwarm <twshere@outlook.com>
 */
import { Untar } from "https://deno.land/std@0.224.0/archive/untar.ts";
import { ensureFile } from "https://deno.land/std@0.224.0/fs/ensure_file.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { join } from "https://deno.land/std@0.224.0/path/join.ts";
import { copy } from "https://deno.land/std@0.224.0/io/copy.ts";
import { readerFromStreamReader } from "https://deno.land/std@0.224.0/io/mod.ts";

export async function unzipTarGz(source: string, target: string) {
    const file = await Deno.open(source);
    const stream = new DecompressionStream("gzip");
    const stream2 = file.readable.pipeThrough(stream);
    const untar = new Untar(readerFromStreamReader(stream2.getReader()));

    for await (const entry of untar) {
        const fileName = join(target, entry.fileName);
        if (entry.type === "directory") {
            await ensureDir(fileName);
            continue;
        }
        await ensureFile(fileName);
        using file = await Deno.open(fileName, { write: true });
        await copy(entry, file);
    }
}
