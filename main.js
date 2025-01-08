// TODO: add prismarine-viewer when 1.21.1 version is released.

const mineflayer = require("mineflayer");
const fs = require("fs");

function saveData(path, data) {
    try {
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
        console.log("Data saved successfully!");
    } catch (err) {
        console.error("Error saving data file:", err);
    }
}

function loadData(path) {
    return JSON.parse(fs.readFileSync(path, "utf8"));
}

function arrayToLowerCase(array) {
    return array.map((item) => {
        return item.toLowerCase();
    });
}

const motd = fs.existsSync("motd") ? fs.readFileSync("motd", "utf8") : null;

if (motd !== null) console.log(motd);


const config = loadData("config.json");

const HOST = config["host"];
const PORT = config["port"];
const VERSION = config["version"];

const dataFilePath = config["datapath"];
const jobsFilePath = config["jobspath"];

const ADMINS = arrayToLowerCase(config["admins"]);

if (ADMINS.length == 0) console.log("No admins specified.")

function isAdmin(username) {
    return ADMINS.includes(username.toLowerCase());
}

const bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    version: VERSION,
    auth: "microsoft",
});

let uuids = {};
let playersData = {};

try {
    playersData = loadData(dataFilePath);
    console.log("Loaded players data:", playersData);
    jobsData = loadData(jobsFilePath);
    console.log("Loaded jobs data:", jobsData);
} catch (err) {
    console.error("Error reading data file:", err);
    playersData = {};
}

async function getUUID(username) {
    if (uuids[username]) return uuids[username];

    try {
        const response = await fetch(
            `https://api.mojang.com/users/profiles/minecraft/${username}`
        );
        if (!response.ok) {
            throw new Error(
                `Failed to fetch UUID for ${username}: ${response.statusText}`
            );
        }
        const data = await response.json();
        uuids[username] = data.id;
        return data.id;
    } catch (error) {
        console.error("Error fetching UUID:", error);
        return null;
    }
}

async function manageMoney(username, amount) {
    if (isNaN(amount)) return bot.chat("Amount is NaN.");

    let uuid = await getUUID(username);
    if (playersData[uuid]) {
        playersData[uuid]["balance"] += amount;
        saveData(dataFilePath, playersData);
        bot.chat(
            (amount > 0 ? "Added " : "Removed ") +
                `${Math.abs(amount)}` +
                (amount > 0 ? " to " : " from ") +
                `${username}'s balance.`
        );
    } else {
        bot.chat(`Player ${username} hasn't registered yet.`);
    }
}

function logUsage(username, args) {
    console.log(`${username} executed ${args[0].toLowerCase()}; ${args}`);
}

bot.on("chat", async (username, message) => {
    if (username === bot.username) return;

    const args = message.trim().split(" ");

    playersData = loadData(dataFilePath);
    switch (args[0].toLowerCase()) {
        case "#help":
        case "#man":
        case "#manual":
            logUsage(username, args);

            bot.chat(
                "Find manual at GitHub -> github.com/blurry16/RPManager-mineflayer/blob/master/MAN.md"
            );
            break;

        case "#register":
            logUsage(username, args);

            uuid = await getUUID(username);
            if (playersData[uuid]) {
                bot.chat(`${username} is already registered.`);
            } else {
                playersData[uuid] = {
                    username: username,
                    balance: 500,
                    job: null,
                    registeredAt: new Date().toISOString(),
                };
                saveData(dataFilePath, playersData);
                bot.chat(`Player ${username} successfully registered!`);
            }
            break;

        case "#balance":
            logUsage(username, args);

            username = args.length == 1 ? username : args[1];
            uuid = await getUUID(username);
            if (uuid === null) {
                bot.chat(`Error fetching ${args[1]}'s UUID.`);
                break;
            }
            if (playersData[uuid]) {
                balance = playersData[uuid]["balance"];
                bot.chat(`Balance of player ${username} is ${balance}.`);
            } else {
                bot.chat(`Player ${username} hasn't registered yet.`);
            }

            break;

        case "#pay":
            logUsage(username, args);

            if (username.toLowerCase() == args[1].toLowerCase) {
                bot.chat("You can't pay yourself.");
                break;
            }

            amount = Number(args[2]);
            if (isNaN(amount)) {
                bot.chat("Amount is NaN.");
                break;
            }

            uuid = await getUUID(username);
            if (playersData[uuid]) {
                payuuid = await getUUID(args[1]);
                if (payuuid === null) {
                    bot.chat(`Error fetching ${args[1]}'s UUID.`);
                    break;
                }
                if (amount < 1) {
                    bot.chat("Amount must be more or equal to 1.");
                    break;
                }
                if (!playersData[payuuid]) {
                    bot.chat(`Player ${args[1]} hasn't registered yet.`);
                    break;
                }
                if (playersData[uuid]["balance"] < amount) {
                    bot.chat(`Player ${username} has not enough of money.`);
                    break;
                }
                playersData[uuid]["balance"] -= amount;
                playersData[payuuid]["balance"] += amount;
                saveData(dataFilePath, playersData);
                bot.chat(
                    `Player ${username} successfully paid ${amount} to ${playersData[payuuid]["username"]}.`
                );
            } else {
                bot.chat(`Player ${username} hasn't registered yet.`);
            }

            break;

        case "#newjob":
            logUsage(username, args);

            if (!isAdmin(username)) break;

            if (args.length == 1) {
                bot.chat("Not enough arguments!");
                break;
            }
            jobName = args[1].toLowerCase();
            wage = Number(args[2]);
            if (isNaN(wage)) {
                bot.chat("Wage is NaN.");
                break;
            }
            if (jobsData[jobName]) {
                bot.chat(`Job ${jobName} already exists.`);
                break;
            }
            jobsData[jobName] = wage;
            saveData(jobsFilePath, jobsData);
            console.log(`Created job ${jobName} with wage ${wage}.`);
            bot.chat(`Created job ${jobName} with wage ${wage}.`);

            break;

        case "#setjob":
            logUsage(username, args);

            if (!isAdmin(username)) break;

            if (args.length < 3) {
                bot.chat("Not enough arguments!");
                break;
            }

            toSetJob = args[2].toLowerCase();
            if (!jobsData[toSetJob]) {
                bot.chat(`Job ${toSetJob} doesn't exist.`);
                break;
            }

            toSetUuid = await getUUID(args[1]);

            if (toSetUuid === null) {
                bot.chat(`Error fetching ${args[1]}'s UUID.`);
                break;
            }
            if (!playersData[toSetUuid]) {
                bot.chat(`Player ${args[1]} hasn't registered yet.`);
                break;
            }
            playersData[toSetUuid]["job"] = toSetJob;
            saveData(dataFilePath, playersData);
            bot.chat(
                `Congrats player ${args[1]} on their new job of ${toSetJob}!`
            );

            break;

        case "#deljob":
            logUsage(username, args);

            if (!isAdmin(username)) break;

            if (args.length == 1) {
                bot.chat("Not enough arguments!");
                break;
            }

            c = 0;
            largs = arrayToLowerCase(args);
            for (job in jobsData) {
                if (largs.includes(job)) {
                    delete jobsData[job];
                    c++;
                    console.log(`Job ${job} deleted.`);
                }
            }
            console.log(`${c} jobs were deleted.`);
            bot.chat(`${c} jobs were deleted.`);
            break;

        case "#resetjob":
            logUsage(username, args);

            if (!isAdmin(username)) break;

            if (args.length == 1) {
                bot.chat("Not enough arguments!");
                break;
            }

            c = 0;
            largs = arrayToLowerCase(args);
            for (uuid in playersData) {
                if (
                    largs.includes(
                        playersData[uuid]["username"].toLowerCase()
                    ) &&
                    playersData[uuid]["job"]
                ) {
                    playersData[uuid]["job"] = null;
                    c++;
                    console.log(
                        `Job reset for ${playersData[uuid]["username"]}`
                    );
                }
            }
            saveData(dataFilePath, playersData);
            console.log(`Job reset for ${c} players.`);
            bot.chat(`Job reset for ${c} players.`);
            break;

        case "#getjob":
            logUsage(username, args);

            username = args.length == 1 ? username : args[1];
            uuid = await getUUID(username);
            if (uuid === null) {
                bot.chat(`Error fetching ${args[1]}'s UUID.`);
                break;
            }

            if (!playersData[uuid]) {
                bot.chat(`Player ${username} hasn't registered yet.`);
                break;
            }

            if (playersData[uuid]["job"] === null) {
                bot.chat(`Player ${username} has no job.`);
                break;
            } else {
                job = playersData[uuid]["job"];
                bot.chat(
                    `Player ${username} has ${job} job with ${jobsData[job]} wage.`
                );
            }
            break;

        case "#payall":
            logUsage(username, args);

            if (!isAdmin(username)) break;

            for (i in playersData) {
                job = playersData[i]["job"];
                if (job) {
                    playersData[i]["balance"] += jobsData[job];
                    console.log(`Paid wage to ${playersData[i]["username"]}`);
                }
            }
            saveData(dataFilePath, playersData);

            bot.chat("Paid salary to all players.");
            console.log("Paid salary to all players.");

            break;

        case "#paywage":
            logUsage(username, args);

            if (!isAdmin(username)) break;

            if (args.length == 1) {
                bot.chat("Not enough arguments!");
                break;
            }

            c = 0;
            largs = arrayToLowerCase(args);
            for (uuid in playersData) {
                if (playersData[uuid]["job"] === null) continue;
                if (
                    largs.includes(playersData[uuid]["username"].toLowerCase())
                ) {
                    playersData[uuid]["balance"] +=
                        jobsData[playersData[uuid]["job"]];
                    c++;
                }
            }
            saveData(dataFilePath, playersData);
            bot.chat(`Salary was paid to ${c} players.`);

            break;

        case "#addmoney":
            logUsage(username, args);

            if (!isAdmin(username)) return;
            if (args.length < 3) {
                bot.chat("Not enough arguments!");
                break;
            }
            manageMoney(args[1], Number(args[2]));
            break;

        case "#removemoney":
        case "#rmmoney":
            logUsage(username, args);

            if (!isAdmin(username)) return;
            if (args.length == 1) {
                bot.chat("Not enough arguments!");
                break;
            }
            manageMoney(args[1], -Number(args[2]));
            break;

        case "#github":
            console.log(`${username} executed #github; ${args}`);
            bot.chat("github.com/blurry16/RPManager-mineflayer");
    }
});

bot.on("spawn", () => {
    console.log(`Bot ${bot.username} has spawned!`);
});

bot.on("error", (err) => {
    console.error("Bot error:", err);
});
