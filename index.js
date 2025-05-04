const mineflayer = require('mineflayer');
const { pathfinder, goals } = require('mineflayer-pathfinder');
const vec3 = require('vec3');

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
var food_tags = [
    "bread", "apple", "cookie", "beef"
]

var signsFound = {}

const bot = mineflayer.createBot({
  host: server_address,
  port: port,
  username: username,
  version: version
});
bot.loadPlugin(pathfinder);

let walking_to_point = false
let buying_sign = false
bot.on('spawn', () => {
    console.log('Bot has spawned.');
    setInterval(() => {
        let walk_to_sign = false
        checkForSigns()
        eatFood()
        checkHunger()
        if (walking_to_point) {
            const distance = bot.entity.position.distanceTo(vec3(walking_to_point[0], walking_to_point[1], walking_to_point[2]));
            if (distance < 3) {
                if (buying_sign) {
                    bot.activateBlock(bot.blockAt(vec3(walking_to_point[0], walking_to_point[1], walking_to_point[2])))
                    buying_sign = false
                }
                walking_to_point = false
            }
        }
        if (Math.random() > 0.9) walk_to_sign = true
        if (walk_to_sign) {
            if (Object.keys(signsFound).length == 0) return
            let sign = Object.keys(signsFound)[Math.floor(Math.random() * Object.keys(signsFound).length)].split("x")
            walking_to_point = sign
            const goal = new goals.GoalNear(
                sign[0], sign[1], sign[2], 1
            );
            bot.pathfinder.setGoal(goal);
        } else {
            if (walking_to_point) return
            const goal = new goals.GoalNear(
                bot.entity.position.x + (Math.random() * 50 - 25), 
                bot.entity.position.y, 
                bot.entity.position.z + (Math.random() * 50 - 25), 1
            );
            bot.pathfinder.setGoal(goal);
        }
    }, 2000)
});

async function eatFood() {
    const foodItem = bot.inventory.items().find(item => food_tags.includes(item.name));
    if (!foodItem) return

    try {
        await bot.equip(foodItem, 'hand');
        await bot.consume();
    } catch (err) {
        console.log("Couldn't eat food: " + err.message)
    }
}

function checkHunger() {
    if (bot.food < 10) {
        if (Object.keys(signsFound).length == 0) return

        let sign_is_food = false
        let signCoordinates;
        for (let i = 0; i < 20; i++) {
            if (sign_is_food) continue
            signCoordinates = Object.keys(signsFound)[Math.floor(Math.random() * Object.keys(signsFound).length)].split("x")
            let sign = signsFound[`${signCoordinates[0]}x${signCoordinates[1]}x${signCoordinates[2]}`]

            for (let item = 0; item < food_tags.length; item++) {
                if (sign["text"].includes(food_tags[item])) {
                    sign_is_food = true
                }
            }
        }

        walking_to_point = signCoordinates
        buying_sign = true
    }
}

function checkForSigns() {
    const signs = bot.findBlocks({
        matching: (block) => { return block.name.includes('sign') },
        maxDistance: 10,
        count: 99,
    });

    if (signs.length > 0) {
        signs.forEach(sign => {
            const block = bot.blockAt(sign);
            if (block && block.name.includes('sign')) {
                const signText = block.getSignText()[0].replace(/\n/g, '#');
                if (signText == "   ") return
                if (!signText.includes("[buy]") && !signText.includes("[sell]")) return
                let shopText = signText.split("#")
                signsFound[`${sign.x}x${sign.y}x${sign.z}`] = {
                    "type": shopText[0].replace("[", "").replace("]", ""),
                    "text": shopText[1].toLowerCase() + " " + shopText[2].toLowerCase(),
                    "price": shopText[3].replace("$", "")
                }
            }
        });
    }

    console.log(signsFound)
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