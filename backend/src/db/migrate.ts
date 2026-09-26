import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { FileMigrationProvider, Migrator } from "kysely/migration";
import { db } from "./index.js";

const migrationFolder = fileURLToPath(
  new URL("./migrations/", import.meta.url),
);

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder,

    import: async (migrationPath) => {
      return import(pathToFileURL(migrationPath).href);
    },
  }),
});

const { error, results } = await migrator.migrateToLatest();

results?.forEach((result) => {
  console.log(`${result.status}: ${result.migrationName}`);
});

if (error) {
  console.error("Migration failed");
  console.error(error instanceof Error ? error.message : 'Unknown migration error');
  process.exitCode = 1;
}

await db.destroy();
