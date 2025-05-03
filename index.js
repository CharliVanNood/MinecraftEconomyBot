const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

// SOME CONFIG OPTIONS:
const server_address = 'polydural.com'
const port = 25565
const username = 'Ruby'
const version = false

// If the server has an authentication plugin turn this on
const auth_plugin = true
// The password the bots will use, please change as everyone can see this specific one in the repo
const bot_password = 'DeF4ultNPCP455word!!!'

var hit_messages = [
    "Ouch, Don't hit me :C",
    "Could you please stop that",
    "THAT HURTS!",
    "Please leave me alone :C",
    "Can I help you?!"
]

const bot = mineflayer.createBot({
  host: server_address,
  port: port,
  username: username,
  version: version
});
bot.loadPlugin(pathfinder);

bot.on('spawn', () => {
    console.log('Bot has spawned.');
});

function checkForSigns() {
    bot.chat(`Looking for signs`);
    const signs = bot.findBlocks({
        matching: (block) => { return block.name.includes('sign') },
        maxDistance: 10,
        count: 99,
    });

    if (signs.length > 0) {
        bot.chat(`Wow I see ${signs.length} signs`);
        signs.forEach(sign => {
            const block = bot.blockAt(sign);
            if (block && block.name.includes('sign')) {
                const signText = block.getSignText()[0];
                if (signText == "\n\n\n") return
                console.log(signText)
            }
        });
    } else {
        bot.chat(`I see no signs :C`);
    }
}

var attackedBy = {}
var latestAttacker = ""
bot.on('entitySwingArm', (entity) => {
    if (entity.type === 'player' && entity != bot.entity) {
        latestAttacker = entity.username
    }
});
bot.on('entityHurt', (entity) => {
    if (entity === bot.entity) {
        // keep track of who hit how often (totally not to get mad at those)
        if (Object.keys(attackedBy).includes(latestAttacker)) attackedBy[latestAttacker] += 1
        else attackedBy[latestAttacker] = 1

        console.log(bot.health)
        bot.chat(hit_messages[Math.floor(Math.random() * hit_messages.length)]);
        
        const player = bot.players[latestAttacker];
        if (!player || !player.entity) return

        const head_position = player.entity.position.offset(0, player.entity.height, 0);
        bot.lookAt(head_position)

        // after 5 hits, she's mad
        if (attackedBy[latestAttacker] < 5) return

        const goal = new goals.GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 1);
        bot.pathfinder.setGoal(goal);

        const tryToAttack = setInterval(() => {
            if (!player.entity.isValid || !player.entity.position) {
                clearInterval(tryToAttack);
                return
            }
            const distance = bot.entity.position.distanceTo(player.entity.position);
            if (distance < 3) {
                bot.attack(player)
                clearInterval(tryToAttack);
            }
        }, 200)
    }
});

bot.on('message', (json_message) => {
    let message = json_message.toString().toLowerCase()
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

    if (message === 'america ya') {
        bot.chat(`HALLO ${username}!`);
    } else if (message === 'hunger') {
        bot.chat(`My hunger level is ${bot.food}/20`);
    } else if (message === 'signs') {
        checkForSigns()
    }
});

bot.on('error', err => console.error('Error:', err));
bot.on('end', () => console.log('Bot has been disconnected'));
