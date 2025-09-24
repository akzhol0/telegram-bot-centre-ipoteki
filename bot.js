const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");
const schedule = require("node-schedule");

const {
  firstMessage,
  phoneInformation,
  commands,
  about,
  messages,
} = require("./text.js");

const token = "8257490360:AAGxLEH456Gdkij3vBFSKwEJKyTMlVNMuaE";
const bot = new TelegramBot(token, { polling: true });

const usersFile = path.join(__dirname, "users.json");

function getUsers() {
  if (!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile));
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const opts = {
    reply_markup: {
      keyboard: [[{ text: "Поделиться номером", request_contact: true }]],
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  };

  bot.sendMessage(
    chatId,
    "Привет! Поделись своим номером для регистрации, нажми на кнопку снизу.",
    opts,
  );
});

bot.on("contact", (msg) => {
  const chatId = msg.chat.id;
  const phone = msg.contact.phone_number;
  const name = msg.contact.first_name;

  let users = getUsers();
  const existingUser = users.find((u) => u.chatId === chatId);

  if (!existingUser) {
    users.push({
      chatId,
      phone,
      name,
      day: 1,
      dateAdded: new Date().toISOString(),
    });
    saveUsers(users);
  }

  bot.sendMessage(
    chatId,
    `Спасибо, ${name}! Твой номер ${phone} сохранён.\n\n${firstMessage}`,
    { reply_markup: { remove_keyboard: true } },
  );
});

bot.onText(/^!help$/i, (msg) => bot.sendMessage(msg.chat.id, commands));
bot.onText(/^!phone$/i, (msg) =>
  bot.sendMessage(msg.chat.id, phoneInformation),
);
bot.onText(/^!about$/i, (msg) => bot.sendMessage(msg.chat.id, about));

schedule.scheduleJob({ hour: 10, minute: 0, tz: "Asia/Almaty" }, async () => {
  const users = getUsers();

  for (const user of users) {
    if (user.day <= messages.length) {
      const msg = messages[user.day - 1];
      await bot
        .sendMessage(user.chatId, msg)
        .catch((err) => console.log(`Ошибка отправки ${user.chatId}:`, err));

      user.day += 1;
      await new Promise((r) => setTimeout(r, 1000)); // пауза 100мс
    }
  }

  saveUsers(users);
});
