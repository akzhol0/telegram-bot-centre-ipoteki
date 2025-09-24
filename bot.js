const TelegramBot = require("node-telegram-bot-api");
const sqlite3 = require("sqlite3").verbose();

// === НАСТРОЙКИ ===
const TOKEN = "8257490360:AAGxLEH456Gdkij3vBFSKwEJKyTMlVNMuaE";
const bot = new TelegramBot(TOKEN, { polling: true });

// === БАЗА ДАННЫХ ===
const db = new sqlite3.Database("users.db");

// создаём таблицу, если её нет
db.run("CREATE TABLE IF NOT EXISTS users (chat_id INTEGER PRIMARY KEY)");

// === КОМАНДЫ ===
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // добавляем пользователя в БД
  db.run("INSERT OR IGNORE INTO users(chat_id) VALUES(?)", [chatId]);

  bot.sendMessage(chatId, "👋 Привет! Ты подписан на ежедневную рассылку.");
});

// === РАССЫЛКА ===
function broadcast(message) {
  db.all("SELECT chat_id FROM users", [], (err, rows) => {
    if (err) {
      console.error("Ошибка выборки:", err);
      return;
    }
    rows.forEach((row) => {
      bot.sendMessage(row.chat_id, message).catch((e) =>
        console.error("Ошибка отправки:", e.message)
      );
    });
  });
}

// пример: рассылка раз в минуту
setInterval(() => {
  broadcast("⏰ Ежедневная информация!");
}, 60 * 1000);
