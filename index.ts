import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { Telegraf } from "telegraf";

(async () => {
  const telegramBotToken = getInput("telegram-bot-token");
  const telegramChatId = getInput("telegram-chat-id");
  const githubToken = getInput("github-token");

  const bot = new Telegraf(telegramBotToken);

  const octokit = getOctokit(githubToken);

  const runId = context.runId;
  const { owner, repo } = context.repo;

  const {
    data: { jobs },
  } = await octokit.rest.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id: runId,
  });

  const preparedJobs = jobs
    .toSorted((a, b) => {
      const dateA = new Date(a.completed_at).getTime();
      const dateB = new Date(b.completed_at).getTime();

      return dateA - dateB;
    })
    .map(({ name, status }) => ({
      name,
      status,
    }));

  telegramChatId.split(",").forEach((id) => {
    const fullRef = context.ref;
    const branchName = fullRef.replace("refs/heads/", "");
    const titleMessage = `Новое уведомление от [${repo}](https://github.com/${repo}) в ветке ${branchName}`;

    const pipelineUrl = `https://github.com/${repo}/actions/runs/${runId}`;
    const pipelineMessage = `[Посмотреть подробнее](${pipelineUrl})`;

    const jobsMessage = preparedJobs
      .map(
        (job) =>
          `${
            {
              queued: "⏳ В очереди",
              in_progress: "🔄 В процессе",
              completed: "✅ Завершено",
              waiting: "⏸️ Ожидает",
            }[job.status]
          } ${job.name}`
      )
      .join("\n");

    const message = bot.telegram.sendMessage(
      id,
      `
      ${titleMessage}
      ${jobsMessage}
      ${pipelineMessage}
      `,
      { parse_mode: "MarkdownV2" }
    );
  });
})();
