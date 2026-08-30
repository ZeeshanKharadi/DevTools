import type { ToolContent } from "./types";

export const cronGeneratorContent: ToolContent = {
  privacy: "Processed locally — schedules are built in your browser.",
  howTo: [
    {
      title: "Choose a schedule",
      body: "Pick a common pattern such as every minute, hourly, daily, weekly, or weekdays. Add a time or weekday when the form asks for it.",
    },
    {
      title: "Read the expression",
      body: "The cron generator writes a standard 5-field expression: minute hour day-of-month month day-of-week. It also explains that same subset in plain language.",
    },
    {
      title: "Use an example",
      body: "Load a common cron schedule such as weekdays at 9 AM. V1 does not read Quartz, AWS, or 6-field cron.",
    },
  ],
  examples: [
    {
      title: "Every minute",
      body: "* * * * * runs every minute.",
    },
    {
      title: "Every hour",
      body: "0 * * * * runs at the start of every hour.",
    },
    {
      title: "Every day at midnight",
      body: "0 0 * * * runs at 12:00 AM every day.",
    },
    {
      title: "Every day at 9 AM",
      body: "0 9 * * * runs at 9:00 AM every day.",
    },
    {
      title: "Every Monday at 9 AM",
      body: "0 9 * * 1 runs at 9:00 AM every Monday. Weekday 0 is Sunday in this generator.",
    },
    {
      title: "Weekdays at 9 AM",
      body: "0 9 * * 1-5 runs at 9:00 AM every Monday through Friday.",
    },
  ],
  faq: [
    {
      question: "What cron format does this generate?",
      answer:
        "Standard 5-field cron: minute, hour, day of month, month, and day of week. No seconds, year, Quartz, or AWS cron in V1.",
    },
    {
      question: "Can I paste any cron expression?",
      answer:
        "The form generates a documented subset. The explainer only describes expressions this UI can create. It will not invent a meaning for unsupported syntax.",
    },
    {
      question: "Does the cron expression generator run on a server?",
      answer:
        "No. The expression and explanation are built in your browser.",
    },
  ],
};
