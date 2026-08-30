import type { ToolContent } from "./types";

export const sqlFormatterContent: ToolContent = {
  privacy: "Processed locally — your SQL never leaves your browser.",
  howTo: [
    {
      title: "Paste SQL",
      body: "Put the query in the input. Choose the dialect that matches your database. The formatter is loaded only for this page.",
    },
    {
      title: "Format",
      body: "Click Format or press Ctrl+Enter / Cmd+Enter. Output is pretty-printed with 2-space indentation. This does not check that the query is valid or executable.",
    },
    {
      title: "Copy or download",
      body: "Copy the result or download a .sql file. Clear resets the workspace. Nothing is uploaded.",
    },
  ],
  examples: [
    {
      title: "Pretty-print a compact query",
      body: "select id,name from users where active=1 becomes a multi-line query with clauses on their own lines. Keyword case is preserved.",
    },
    {
      title: "Pick a dialect",
      body: "MySQL, PostgreSQL, SQLite, Transact-SQL, and the other dialects listed in the selector come from the sql-formatter library. This is not a universal SQL parser.",
    },
  ],
  faq: [
    {
      question: "Does formatting SQL mean the query is valid?",
      answer:
        "No. This tool only rearranges whitespace and keywords. It does not execute SQL and does not guarantee that the query will run.",
    },
    {
      question: "Which SQL dialects are supported?",
      answer:
        "Only the dialects provided by sql-formatter, shown in the selector (including Standard SQL, MySQL, PostgreSQL, SQLite, Transact-SQL, and others). Do not assume every vendor dialect works.",
    },
    {
      question: "Is my SQL sent to a server?",
      answer:
        "No. The sql-formatter library runs in your browser after it loads for this tool.",
    },
  ],
};
