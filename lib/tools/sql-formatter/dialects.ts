import type { SqlLanguage } from "sql-formatter";

export type SqlDialectOption = {
  id: SqlLanguage;
  label: string;
};

export const SQL_DIALECTS: readonly SqlDialectOption[] = [
  { id: "sql", label: "Standard SQL" },
  { id: "mysql", label: "MySQL" },
  { id: "mariadb", label: "MariaDB" },
  { id: "postgresql", label: "PostgreSQL" },
  { id: "sqlite", label: "SQLite" },
  { id: "transactsql", label: "Transact-SQL (SQL Server)" },
  { id: "tsql", label: "T-SQL (alias)" },
  { id: "plsql", label: "Oracle PL/SQL" },
  { id: "bigquery", label: "BigQuery" },
  { id: "snowflake", label: "Snowflake" },
  { id: "redshift", label: "Amazon Redshift" },
  { id: "spark", label: "Spark SQL" },
  { id: "trino", label: "Trino" },
  { id: "clickhouse", label: "ClickHouse" },
  { id: "duckdb", label: "DuckDB" },
  { id: "hive", label: "Hive" },
  { id: "db2", label: "IBM Db2" },
  { id: "db2i", label: "IBM Db2i" },
  { id: "tidb", label: "TiDB" },
  { id: "n1ql", label: "Couchbase N1QL" },
  { id: "singlestoredb", label: "SingleStoreDB" },
];

export const DEFAULT_SQL_DIALECT: SqlLanguage = "sql";

export const SQL_FORMATTER_EXAMPLE = `select u.id,u.name,o.total from users u join orders o on o.user_id=u.id where o.total>10 order by o.total desc;`;
