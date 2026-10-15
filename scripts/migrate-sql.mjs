import { Client } from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * Applies the MSNSS additive SQL migrations in `drizzle/` to the configured
 * database, one statement at a time.
 *
 * Scoped on purpose: it runs only these hand-written, additive DDL files instead
 * of a full `drizzle-kit push`, so no unrelated schema drift is ever surfaced
 * against a live database. Every file is written to be idempotent, so re-running
 * is always safe.
 *
 *   node scripts/migrate-sql.mjs                                  # every drizzle/*.sql, in order
 *   node scripts/migrate-sql.mjs drizzle/0003_product_media.sql   # only the named files
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const drizzleDir = path.join(root, "drizzle");

const env = Object.fromEntries(
  readFileSync(path.join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((line) => /^\s*[A-Za-z_]+\s*=/.test(line))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

if (!env.DATABASE_URL) {
  console.error("DATABASE_URL is missing from .env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const files = args.length
  ? args.map((file) => (path.isAbsolute(file) ? file : path.join(root, file)))
  : readdirSync(drizzleDir)
      .filter((name) => name.toLowerCase().endsWith(".sql"))
      .sort()
      .map((name) => path.join(drizzleDir, name));

/**
 * Split a SQL script into individual statements.
 *
 * Executing a file as one multi-statement query would analyse the whole string
 * up front, so a later INSERT could be planned before an earlier CREATE TABLE /
 * ALTER TABLE has actually run. Sending each statement in its own round-trip
 * means every later statement sees the objects created by the earlier ones.
 *
 * A naive `split(";")` is not enough: semicolons also appear inside string
 * literals, quoted identifiers, comments and `DO $$ ... $$` blocks. This walks
 * the script character by character and only treats a `;` as a terminator when
 * it sits in normal code.
 */
function splitStatements(input) {
  const statements = [];
  let current = "";
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    const next = input[i + 1];

    // Line comment: skip to end of line.
    if (ch === "-" && next === "-") {
      const end = input.indexOf("\n", i);
      i = end === -1 ? input.length : end;
      continue;
    }

    // Block comment: skip to the closing */ (comments are nestable in Postgres).
    if (ch === "/" && next === "*") {
      let depth = 1;
      i += 2;
      while (i < input.length && depth > 0) {
        if (input[i] === "/" && input[i + 1] === "*") {
          depth += 1;
          i += 2;
        } else if (input[i] === "*" && input[i + 1] === "/") {
          depth -= 1;
          i += 2;
        } else {
          i += 1;
        }
      }
      continue;
    }

    // String literal: copy verbatim ('' escapes an embedded quote).
    if (ch === "'") {
      current += ch;
      i += 1;
      while (i < input.length) {
        current += input[i];
        if (input[i] === "'" && input[i + 1] === "'") {
          current += input[i + 1];
          i += 2;
          continue;
        }
        if (input[i] === "'") {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    // Quoted identifier: copy verbatim ("" escapes an embedded quote).
    if (ch === '"') {
      current += ch;
      i += 1;
      while (i < input.length) {
        current += input[i];
        if (input[i] === '"' && input[i + 1] === '"') {
          current += input[i + 1];
          i += 2;
          continue;
        }
        if (input[i] === '"') {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    // Dollar-quoted string / body ($tag$ ... $tag$): copy verbatim.
    if (ch === "$") {
      const tag = /^\$[A-Za-z_]*\$/.exec(input.slice(i));
      if (tag) {
        const delimiter = tag[0];
        const end = input.indexOf(delimiter, i + delimiter.length);
        const stop = end === -1 ? input.length : end + delimiter.length;
        current += input.slice(i, stop);
        i = stop;
        continue;
      }
    }

    // Statement terminator.
    if (ch === ";") {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
      i += 1;
      continue;
    }

    current += ch;
    i += 1;
  }

  const last = current.trim();
  if (last) statements.push(last);
  return statements;
}

const client = new Client({ connectionString: env.DATABASE_URL });
await client.connect();
try {
  let total = 0;
  for (const file of files) {
    const statements = splitStatements(readFileSync(file, "utf8"));
    for (const statement of statements) {
      await client.query(statement);
    }
    total += statements.length;
    console.log(`✓ ${path.relative(root, file)} — ${statements.length} statement(s)`);
  }

  const { rows } = await client.query(
    `select
       (select count(*) from products) as products,
       (select count(*) from product_images) as product_images,
       (select count(*) from product_images where media_type = 'video') as product_videos`
  );
  const counts = rows[0];
  console.log(
    `✓ migrations up to date — ${files.length} file(s), ${total} statement(s); ` +
      `${counts.product_images} gallery row(s) (${counts.product_videos} video) across ${counts.products} product(s).`
  );
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
