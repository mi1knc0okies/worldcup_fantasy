import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrated");
process.exit(0);
