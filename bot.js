const { Client, GatewayIntentBits, Partials } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessageReactions
    ],
    partials: [
        Partials.Channel
    ] });
const say = require('say');
const {
	NoSubscriberBehavior,
	StreamType,
	createAudioPlayer,
	createAudioResource,
	entersState,
	AudioPlayerStatus,
	VoiceConnectionStatus,
	joinVoiceChannel,
} = require('@discordjs/voice');
require('dotenv').config();

GameState = {
    INIT: 1,
    NOMINATE_CHANCELLOR: 2,
    PLAYER_VOTE: 3,
    PRESIDENT_DISCARD: 4,
    CHANCELLOR_DISCARD: 5,
    KILL: 6
}

const MAX_FACIST = 6;
const MAX_LIBERAL = 5;

var channelVoice;
var channelText;
var guild;
var connection;

var voice = null;
var voicePrefix = "Microsoft ";
var voiceSuffix = " Desktop";
var commandPrefix = "!";

var voices = ["David", "Hazel", "Zira"];

var players = [];
var hitlerID = -1;
var facistsIDs = [];
var currentPresidentID = -1;
var currentChancellorID = -1;
var previousPresidentID = -1;
var previousChancellorID = -1;
var numFails = 0;
var numLiberal = 0;
var numFacist = 0;
var currentState = GameState.INIT;

var currentVoteBalance = 0;
var currentVoters = [];

var cardsDeck = []
var cardsDrawn = []
var cardsDiscards = []

var numToEmoji = {
    0: "0️⃣",
    1: "1️⃣",
    2: "2️⃣",
    3: "3️⃣",
    4: "4️⃣",
    5: "5️⃣",
    6: "6️⃣",
    7: "7️⃣",
    8: "8️⃣",
    9: "9️⃣",
    10: "🔟"
}

var numFromEmoji = {
    "0️⃣": 0,
    "1️⃣": 1,
    "2️⃣": 2,
    "3️⃣": 3,
    "4️⃣": 4,
    "5️⃣": 5,
    "6️⃣": 6,
    "7️⃣": 7,
    "8️⃣": 8,
    "9️⃣": 9,
    "🔟": 10
}

const cardsLiberal = 6
const cardsFascist = 11

client.once('ready', () => {
    console.log('Ready!');
});

client.on('messageCreate', gotMessage);

client.on('messageReactionAdd', gotReaction);

client.login(process.env.DISCORD_KEY);

async function gotMessage(message) {
    if (message.author.id === client.user.id) {
        return;
    }

    await joinVoiceChannelFromMessage(message)

    if (message.guild !== guild) {
        return;
    }
    var member = message.member;
    // Commands
    if (message.content.startsWith(commandPrefix)) {
        const args = message.content.slice(commandPrefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        switch (command) {
            case 'say':
                saySomething(member.displayName + " said " + args.join(' '));
                break;
            case 'setVoice':
                var input = args[0];
                if (voices.includes(input)) {
                    voice = voicePrefix + input + voiceSuffix;
                    saySomething("Hello there! I'm your new narrator!");
                } else {
                    message.reply('Invalid voice!');
                }
                break;
            case 'listVoices':
                message.reply(voices.join());
                break;
            case 'start':
                if (currentState === GameState.INIT) {
                    for (i = 0; i < cardsLiberal; i++) {
                        cardsDeck.push('l')
                    }
                    for (i = 0; i < cardsFascist; i++) {
                        cardsDeck.push('f')
                    }
                    shuffleArray(cardsDeck);

                    playersWithoutRoles = players.slice();
                    hitlerID = getRandomInt(players.length);
                    playersWithoutRoles.splice(hitlerID, 1);
                    var numFacists = (players.length - 1) / 2 - 1;
                    for (var i = 0; i < numFacists; i++) {
                        var newID = getRandomInt(playersWithoutRoles.length);
                        facistsIDs.push(players.indexOf(playersWithoutRoles[newID]));
                        playersWithoutRoles.splice(newID, 1);
                    }
                    // console.log("Hitler is " + players[hitlerID].displayName + ", facists IDs are " + facistsIDs.join(', '));
                    if (facistsIDs.length != 1) {
                        players[hitlerID].send("You are Hitler, " + players[hitlerID].displayName + "!");
                    } else {
                        players[hitlerID].send("You are Hitler, " + players[hitlerID].displayName + "!\n The facist is " + players[facistsIDs[0]].displayName);
                    }
                    for (var i = 0; i < facistsIDs.length; i++) {
                        var current = players[facistsIDs[i]];
                        var toSend = "You are a Facist, " + current.displayName + "!\n Hitler is " + players[hitlerID].displayName;
                        if (facistsIDs.length > 1) {
                            toSend += ", and the other facists are ";
                            var others = players.filter((a, b) => facistsIDs.indexOf(b) >= 0).splice(i, 1);
                            for (var j = 0; j < others.length; j++) {
                                toSend += others[j].displayName + ", ";
                            }
                        }
                        current.send(toSend);
                    }
                    for (var i = 0; i < playersWithoutRoles.length; i++) {
                        playersWithoutRoles[i].send("You are a Liberal, " + playersWithoutRoles[i].displayName);
                    }
                    currentPresidentID = getRandomInt(players.length);
                    gameLogic(GameState.NOMINATE_CHANCELLOR);
                } else {
                    message.reply('Game in progress!');
                }
                break;
            case "end":
                gameLogic(GameState.INIT)
                break;
            default:
                break;
        }
    } else {
        // Game Actions
        switch (currentState) {
            case GameState.INIT:
                if (!players.includes(member)) {
                    players.push(member);
                    message.reply('Hi ' + member.displayName + ' 😀\nThere are ' + players.length + ' players.');
                    saySomething(member.displayName + " joined the game!");
                } else {
                    message.reply("You are already in the game!")
                }
                break;
            case GameState.NOMINATE_CHANCELLOR:
                if (member == players[currentPresidentID]) {
                    for (var i = 0; i < players.length; i++) {
                        if (players[i].displayName.toLowerCase() === message.content.toLowerCase()) {
                            if (i == previousPresidentID || i == previousChancellorID) {
                                message.reply("You can't nominate people who were in the previous goverment.")
                                return;
                            }
                            currentChancellorID = i;
                            message.react('👍');
                            message.react('👎');
                            gameLogic(GameState.PLAYER_VOTE);
                            return;
                        }
                    }
                    message.reply("Please choose a valid player (use their display name).");
                } else {
                    sayAndPrint("Nice try, " + member.displayName);
                }
                break;
            case GameState.KILL:
                if (member == players[currentPresidentID]) {
                    for (var i = 0; i < players.length; i++) {
                        if (players[i].displayName.toLowerCase() === message.content.toLowerCase()) {
                            if (i == hitlerID) {
                                sayAndPrint("Liberals Won")
                                printGameState()
                                gameLogic(GameState.INIT)
                                return;
                            }
                            if (hitlerID > i) {
                                hitlerID--;
                            }
                            for (j = 0; j < facistsIDs.length; j++) {
                                if (facistsIDs[j] == i) {
                                    facistsIDs = facistsIDs.splice(j, 1);
                                    j--;
                                } else if (facistsIDs[j] > i) {
                                    facistsIDs[j]--;
                                }
                            }
                            if (currentPresidentID > i) {
                                currentPresidentID--;
                                previousPresidentID--;
                            } else if (currentPresidentID == i) {
                                sayAndPrint("Why did you kill yourself, " + players[i].displayName + "?");
                                currentPresidentID--;
                                previousPresidentID = -1;
                            }
                            if (currentChancellorID > i) {
                                currentChancellorID--;
                            } else if (currentChancellorID == i) {
                                currentChancellorID = -1;
                            }
                            previousChancellorID = currentChancellorID;

                            players.splice(i, 1);
                            gameLogic(GameState.NOMINATE_CHANCELLOR);
                            return;
                        }
                    }
                    message.reply("Please choose a valid player (use their display name).");
                } else {
                    sayAndPrint("Nice try, " + member.displayName);
                }
                break;
            default:
        }
    }
}

async function joinVoiceChannelFromMessage(message) {
    if (channelVoice == null) {
        // Checking if the message author is in a voice channel.
        if (!message.member.voice.channel) return message.reply("You must be in a voice channel.");
        channelVoice = message.member.voice.channel;
        // Joining the channel and creating a VoiceConnection.
        const connection = joinVoiceChannel(
            {
                channelId: message.member.voice.channel,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator
            });
        guild = message.guild;
        channelText = message.channel;
    }
}

function gotReaction(reaction, user) {
    if (user.id == client.user.id) {
        return;
    }
    switch (currentState) {
        case GameState.PLAYER_VOTE:
            content = reaction.emoji.name;
            if (content !== '👎' && content !== '👍') {
                return;
            }
            for (var i = 0; i < players.length; i++) {
                if (players[i].id == user.id) {
                    if (currentVoters.indexOf(players[i]) < 0) {
                        currentVoters.push(players[i]);
                        if (content === '👍') {
                            currentVoteBalance++;
                        } else {
                            currentVoteBalance--;
                        }
                    }
                }
            }
            console.log("Voters: " + currentVoters.length);
            if (currentVoters.length == players.length) {
                if (currentVoteBalance > 0) {
                    numFails = 0;
                    gameLogic(GameState.PRESIDENT_DISCARD);
                } else {
                    numFails++;
                    if (numFails >= 3) {
                        sayAndPrint("You failed to enact a goverment three times in a row. The top card was chosen.");
                        var topCard = drawTopCards(1);
                        if (topCard == 'l') {
                            numLiberal++;
                        } else {
                            numFacist++;
                        }
                        numFails = 0;
                    }
                    gameLogic(GameState.NOMINATE_CHANCELLOR);
                }
            }
            break;
        case GameState.PRESIDENT_DISCARD:
            content = reaction.emoji.name;
            if (content !== numToEmoji[1] && content !== numToEmoji[2] && content !== numToEmoji[3]) {
                return;
            }
            for (var i = 0; i < players.length; i++) {
                if (players[i].id == user.id) {
                    if (i == currentPresidentID) {
                        cardsDiscards.push(cardsDrawn.splice(numFromEmoji[content] - 1, 1));
                        gameLogic(GameState.CHANCELLOR_DISCARD);
                    }
                }
            }
            break;
        case GameState.CHANCELLOR_DISCARD:
            content = reaction.emoji.name;
            if (content !== numToEmoji[1] && content !== numToEmoji[2]) {
                return;
            }
            for (var i = 0; i < players.length; i++) {
                if (players[i].id == user.id) {
                    if (i == currentChancellorID) {
                        cardsDiscards.push(cardsDrawn.splice(numFromEmoji[content] - 1, 1));
                        previousPresidentID = currentPresidentID;
                        previousChancellorID = currentChancellorID;
                        if (cardsDrawn[0] == 'l') {
                            numLiberal++;
                        } else {
                            numFacist++;
                            if (numFacist == 3) {
                                validateDeck(3);
                                var toSend = "Top three cards are: ";
                                for (i = 0; i < 3; i++) {
                                    toSend += (cardsDeck[i] == "l" ? "🕊️" : "💀");
                                    if (i < 2) {
                                        toSend += ", ";
                                    }
                                }
                                saySomething(players[currentPresidentID].displayName + " view the top three cards of the deck");
                                players[currentPresidentID].send(toSend);
                            }
                            if (numFacist >= 4) {
                                gameLogic(GameState.KILL);
                                return;
                            }
                        }
                        gameLogic(GameState.NOMINATE_CHANCELLOR);
                    }
                }
            }
            break;
        default:
            break;
    }
}

function gameLogic(nextState) {
    currentState = nextState;
    switch (nextState) {
        case GameState.INIT:
            var toSend = 'The players were: \n'
            for (var i = 0; i < players.length; i++) {
                toSend += players[i].displayName + ", ";
                if (i == hitlerID) {
                    toSend += "was Hitler\n";
                } else if (facistsIDs.indexOf(i) >= 0) {
                    toSend += "a Facist\n";
                } else {
                    toSend += "a Liberal\n";
                }

            }
            sayAndPrint(toSend + "Thank you for playing Secret Hitler, Goodbye!");
            hitlerID = -1;
            previousPresidentID = -1;
            previousChancellorID = -1;
            facistsIDs = [];
            players = [];
            cardsDeck = [];
            cardsDiscards = [];
            cardsDrawn = [];
            break;
        case GameState.NOMINATE_CHANCELLOR:
            if (numLiberal >= MAX_LIBERAL) {
                win("Liberals");
                return;
            }
            if (numFacist >= MAX_FACIST) {
                win("Facists");
                return;
            }
            currentPresidentID++;
            currentPresidentID %= players.length;
            printGameState();
            sayAndPrint(players[currentPresidentID].displayName + ", nominate a chancellor.");
            break;
        case GameState.PLAYER_VOTE:
            currentVoters = [];
            currentVoteBalance = 0;
            if (currentPresidentID == currentChancellorID) {
                sayAndPrint('Everyone, vote Yes or No for the ' + players[currentPresidentID].displayName + ' goverment.');
            } else {
                sayAndPrint('Everyone, vote Yes or No for the ' + players[currentPresidentID].displayName + ' and ' + players[currentChancellorID].displayName + ' goverment.');
            }
            break;
        case GameState.PRESIDENT_DISCARD:
            if (numFacist >= 3 && currentChancellorID == hitlerID) {
                win("Facists");
                return;
            }
            saySomething(players[currentPresidentID].displayName + ', choose a card to discard.');
            console.log("cardsDiscards: " + cardsDiscards.length + "\n cardsDeck: " + cardsDeck.length);
            cardsDrawn = drawTopCards(3);
            printCardsToDiscard(currentPresidentID)
            break;
        case GameState.CHANCELLOR_DISCARD:
            saySomething(players[currentChancellorID].displayName + ', choose a card to discard.');
            printCardsToDiscard(currentChancellorID)
            break;
        case GameState.KILL:
            sayAndPrint(players[currentPresidentID].displayName + ", choose a player to kill!")
            break;
        default:
            break;
    }
}

function printGameState() {
    var empty = '◻';
    var liberal = '🕊️';
    var facist = '💀';
    var toSend = 'Game state:\n';
    for (var i = 0; i < MAX_LIBERAL; i++) {
        toSend += (numLiberal > i ? liberal : empty) + ' ';
    }
    toSend += '\n';
    for (var i = 0; i < MAX_FACIST; i++) {
        toSend += (numFacist > i ? facist : empty) + ' ';
    }
    channelText.send(toSend);
}

function saySomething(text) {
    const timestamp = new Date().getTime();
    const soundPath = `./temp/${timestamp}.wav`;
    say.export(text, voice, 1, soundPath, (err) => {
        if (err) {
            console.error(err);
            return;
        } else {
            // channel.join().then((connection) => {
            //     connection.play(soundPath);
            // }).catch((err) => {
            //     console.error(err);
            // });
            connection.play(soundPath);
        }
    });
}

function sayAndPrint(text) {
    channelText.send(text);
    saySomething(text);
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function printCardsToDiscard(index) {
    var toSend = "Choose a card to discard: \n"
    for (i = 0; i < cardsDrawn.length; i++) {
        toSend += numToEmoji[i + 1] + ": " + (cardsDrawn[i] == "l" ? "🕊️" : "💀") + "\n";
    }

    players[index].send(toSend).then(message => {
        for (i = 0; i < cardsDrawn.length; i++) {
            message.react(numToEmoji[i + 1])
        }
    })
}

function drawTopCards(amount) {
    validateDeck(amount);
    return cardsDeck.splice(0, amount);
}

function validateDeck(amount) {
    if (cardsDeck.length < amount) {
        shuffleArray(cardsDiscards);
        cardsDeck = cardsDeck.concat(cardsDiscards);
    }
}

function win(team) {
    sayAndPrint(team + " won!");
    printGameState();
    gameLogic(GameState.INIT);
}
