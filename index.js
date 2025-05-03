const mineflayer = require('mineflayer');

// SOME CONFIG OPTIONS:
const server_address = 'polydural.com'
const port = 25565
const username = 'Ruby'
const version = false

// If the server has an authentication plugin turn this on
const auth_plugin = true
// The password the bots will use, please change as everyone can see this specific one in the repo
const bot_password = 'DeF4ultNPCP455word!!!'

const bot = mineflayer.createBot({
  host: server_address,
  port: port,
  username: username,
  version: version
});

bot.on('spawn', () => {
    console.log('Bot has spawned.');
});

bot.on('entityHurt', (entity) => {
    if (entity === bot.entity) {
        bot.chat('Ouch, don\'t hit me :C');
    }
});
  

bot.on('message', (json_message) => {
    let message = json_message.toString().toLowerCase()
    console.log(message)
    if (message.includes("/register")) {
        console.log(`I have to register, using password ${bot_password}`)
        bot.chat(`/register ${bot_password} ${bot_password}`);
    } else if (message.includes("/login")) {
        console.log(`I have to log in`)
        bot.chat(`/login ${bot_password}`);
    }
});

bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    console.log(message)

    if (message === 'hello') {
        bot.chat(`Hello ${username}!`);
    }
    if (message === 'hunger') {
        bot.chat(`My hunger level is ${bot.food}/20`);
    }
});

bot.on('error', err => console.error('Error:', err));
bot.on('end', () => console.log('Bot has been disconnected'));
