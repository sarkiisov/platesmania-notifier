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
    .filter((job) => !!job.conclusion)
    .toSorted((a, b) => {
      const dateA = new Date(a.completed_at).getTime();
      const dateB = new Date(b.completed_at).getTime();

      return dateA - dateB;
    })
    .map(({ name, conclusion }) => ({ name, conclusion }));

  telegramChatId.split(",").forEach((id) => {
    const fullRef = context.ref;
    const branchName = fullRef.replace("refs/heads/", "");
    const repoUrl = `https://github.com/${owner}/${repo}/tree/${branchName}`;
    const titleMessage = `⚠️ Новое уведомление от [${repo}](${repoUrl}) в ветке \`${branchName}\``;

    const pipelineUrl = `https://github.com/${owner}/${repo}/actions/runs/${runId}`;
    const pipelineMessage = `[Посмотреть подробнее](${pipelineUrl})`;

    const jobsMessage = preparedJobs
      .map(
        (job) =>
          `${
            {
              success: "✅ Завершено",
              failure: "❌ Ошибка",
              neutral: "⚪ Нейтрально",
              cancelled: "🚫 Отменено",
              skipped: "⏭️ Пропущено",
              timed_out: "⏰ Время ожидания истекло",
              action_required: "⚠️ Требуется действие",
            }[job.conclusion]
          } - \*\*${job.name}\*\*`
      )
      .join("\n");

    bot.telegram.sendMessage(
      id,
      `${titleMessage}\n\n${jobsMessage}\n\n${pipelineMessage}`.replace(
        /-/g,
        "\\-"
      ),
      { parse_mode: "MarkdownV2" }
    );
  });
})();
