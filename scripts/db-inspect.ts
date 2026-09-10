/** One-off: what is already in this database? `npx tsx scripts/db-inspect.ts` */
try {
  process.loadEnvFile(".env.local");
} catch {}

import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("no DATABASE_URL");
  const sql = neon(url);

  const rows = await sql`
    select table_schema, table_name
    from information_schema.tables
    where table_type = 'BASE TABLE'
      and table_schema not in ('pg_catalog', 'information_schema')
    order by table_schema, table_name
  `;

  console.log(`\n${rows.length} table(s):`);
  for (const r of rows) {
    const res = await sql.query(
      `select count(*)::int as n from "${r.table_schema}"."${r.table_name}"`,
    );
    console.log(`  ${r.table_schema}.${r.table_name}  (${res[0].n} rows)`);
  }

  const exts = await sql`select extname from pg_extension order by extname`;
  console.log(`\nextensions: ${exts.map((e) => e.extname).join(", ")}`);

  const schemas = await sql`
    select schema_name from information_schema.schemata
    where schema_name not like 'pg_%' and schema_name <> 'information_schema'
    order by schema_name`;
  console.log(`schemas: ${schemas.map((s) => s.schema_name).join(", ")}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
