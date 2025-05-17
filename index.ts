import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { Telegraf } from "telegraf";

const telegramBotToken = getInput("telegram-bot-token");
const telegramChatId = getInput("telegram-chat-id");
const githubToken = getInput("github-token");

const bot = new Telegraf(telegramBotToken);

// console.log(context);

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

console.log("jobs", jobs);

telegramChatId.split(",").forEach((id) => {
  bot.telegram.sendMessage(id, "Hello from Telegram bot");
});
