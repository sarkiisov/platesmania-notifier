import { getInput } from "@actions/core";
import { context } from "@actions/github";
import { Telegraf } from "telegraf";

const telegramBotToken = getInput("telegram-bot-token");
const telegramChatId = getInput("telegram-chat-id");

const bot = new Telegraf(telegramBotToken);

console.log(context);

telegramChatId.split(",").forEach((id) => {
  bot.telegram.sendMessage(id, "Hello from Telegram bot");
});
