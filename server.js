const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- GAME STATE ---
let players = [];
let currentJudgeIndex = 0;
let submissions = []; 

// --- 1. THE CONTENT ---

// Safe, reliable images from Wikimedia
const memeImages = [
    "https://upload.wikimedia.org/wikipedia/en/9/9a/Trollface_non-free.png",
    "https://upload.wikimedia.org/wikipedia/commons/e/e3/Buddy_christ.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/ff/Deep_in_thought.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3b/Paris_Tuileries_Garden_Facepalm_statue.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Gfp-ny-catskills-mountains-view-from-slide-mountain.jpg/640px-Gfp-ny-catskills-mountains-view-from-slide-mountain.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/6e/Golde33443.jpg", 
    "https://upload.wikimedia.org/wikipedia/commons/1/15/Cat_August_2010-4.jpg", 
    "https://upload.wikimedia.org/wikipedia/commons/9/99/Unimpressed_cat.jpg", 
    "https://upload.wikimedia.org/wikipedia/commons/7/70/Human-screaming-face.svg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/402px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg"
];

// The Master List of Cards
const masterDeck = [
    // ORIGINALS
    "When the teacher says 'pick a partner' and you look at your best friend.",
    "The face you make when the Wi-Fi disconnects during a test.",
    "When you realize you forgot to hit 'Submit' on the assignment.",
    "Trying to eat a snack in class without the teacher noticing.",
    "When the bell rings but the teacher says 'The bell doesn't dismiss you, I do.'",
    "Me explaining to my mom why I need a 'mental health day'.",
    "When you see your teacher at the grocery store.",
    "That one student who reminds the teacher about homework.",
    "When you get called on and you weren't listening.",
    "Waiting for your mom to pick you up and you're the last one there.",
    "When the Zoom meeting ends and you check your hair in the camera.",
    "When you study for the wrong chapter.",
    "Me trying to do math in my head.",
    "When you finish the test first and don't know if you're a genius or failed.",
    "The look you give your friend when the teacher makes a bad joke.",
    "When the teacher uses your project as the 'good example'.",
    "When you type a whole paragraph and accidentally delete it.",
    "Finding out the test is open-book.",
    "When someone sits in your unassigned assigned seat.",
    "Trying to hold in a laugh when the room is completely silent.",
    "When the video won't load and the whole class stares at the buffering circle.",
    "That panic when the teacher walks by your desk during a test.",
    "When you actually understand the math lesson for once.",
    "Waking up 5 minutes before the Zoom class starts.",
    "When you ask to go to the bathroom and the teacher says 'I don't know, CAN you?'",
    "The face you make when you hear your name called for attendance.",
    "When you have to turn your camera on.",
    "Realizing you've been on mute the whole time you were talking.",
    "When the teacher says 'This will be on the test'.",
    "Thinking it's Friday but it's only Tuesday.",
    
    // GAMING & TECH
    "Losing your 1st place streak in Kahoot because of a single misclick.",
    "When you walk into the wrong classroom and everyone stares at you.",
    "Trying to make your essay look longer by increasing the font size to 12.1.",
    "When the smart kid gets a different answer than you.",
    "The sheer panic of being next in line to read out loud.",
    "When you open a pack of gum and suddenly everyone is your best friend.",
    "Submitting the assignment at exactly 11:59 PM.",
    "When your back hurts from carrying the entire group project.",
    "Typing furiously on your laptop so it looks like you're working.",
    "When the teacher says 'Wait, let me tell you a story' and you know class is basically over.",
    "Coming back from the bathroom and realizing you missed the entire lesson.",
    "When the teacher can't figure out how to make the audio work on the video.",
    "Starting a new notebook and writing in your best handwriting for exactly one page.",
    "Having a full conversation with your friend in the Google Doc comments.",
    "When you explain an answer and the teacher says 'No', but then the next kid says the same thing and gets it right.",
    "Blaming the lag when you miss an easy shot.",
    "When your controller dies in the middle of a boss fight.",
    "That feeling when you finally beat the level you've been stuck on for 3 days.",
    "When you carry the whole team and get zero credit.",
    "Realizing you've been playing for 6 hours and forgot to eat.",
    "When the game auto-saves right before you die.",
    "Trying to explain to your mom that you can't pause an online game.",
    "When you accidentally throw a grenade at your own team.",
    "Spending 2 hours creating your character just to wear a helmet the whole game.",
    "When you finally get the loot you wanted and the game crashes.",
    "The panic of hearing a creeper hiss behind you.",
    "When someone says 'Ez' after winning by 1 point.",
    "Trying to play stealthily but alerting every enemy on the map.",
    "When you rage quit and immediately launch the game again.",
    "Being the last one alive in Battle Royale and forgetting how to breathe.",
    "When the healer tries to 1v5 the enemy team.",
    "Buying a new game and realizing your PC can't run it.",
    "When you skip the tutorial and have no idea what buttons to press.",
    "The joy of finding a diamond in Minecraft.",
    "When you get voted out in Among Us but you were actually doing tasks.",
    "Spending 3 hours fixing a bug that was just a missing semicolon.",
    "When the code compiles with zero errors on the first try.",
    "Copying code from Stack Overflow and hoping it works.",
    "When you forget to save your project and the power goes out.",
    "Trying to explain to your parents that you aren't hacking, just using Command Prompt.",
    "When you fix one bug and create 10 new ones.",
    "The face you make when the teacher says 'Don't use Google'.",
    "Realizing you've been coding in the wrong file for 20 minutes.",
    "When the Wi-Fi drops by one bar and you act like the world is ending.",
    "Closing 50 Chrome tabs and feeling your computer sigh in relief.",
    "When you accidentally type your password into the username box.",
    "Trying to find the mouse cursor on a dual-monitor setup.",
    "When you inspect element and feel like a hacker.",
    "Waiting for a Windows update that is stuck at 99%.",
    "When the printer jams 5 minutes before the essay is due.",
    "Pluging in the USB correctly on the first try.",
    "When you realize you've been on mute for the entire presentation.",
    "Deleting a line of code and the whole program explodes.",
    "When someone asks 'Can you hack my ex's Instagram?' just because you take CS.",
    "The satisfaction of peeling the plastic off a new monitor.",

    // SCHOOL LIFE
    "When the substitute teacher mispronounces everyone's name.",
    "Trying to open a Velcro binder during a quiet test.",
    "When you make eye contact with your friend while the teacher is yelling.",
    "The sheer terror of the teacher saying 'I'll wait'.",
    "When you finish the test and start staring at the wall so you don't look suspicious.",
    "Realizing you have the same shirt as the teacher.",
    "When the smart kid asks a question that makes the homework harder.",
    "Trying to suppress a cough so you don't disrupt the silence.",
    "When the bell rings and you run out like you're escaping prison.",
    "Dropping your pencil and watching it roll to the other side of the room.",
    "When the teacher says 'Get into groups' and you lock eyes with your squad.",
    "Asking to go to the bathroom just to walk around and stretch your legs.",
    "When you accidentally call the teacher 'Grandma'.",
    "The walk of shame when you have to sharpen your pencil in the middle of a lecture.",
    "When the teacher puts a meme in the PowerPoint and it's from 2012.",
    "Pretending to look for something in your bag when the teacher asks for a volunteer.",
    "When you guess 'C' on a multiple choice test and get it right.",
    "The sound of 30 zippers zipping up at the same time.",
    "When you write the date as last year for the entire month of January.",
    "Realizing your headphones weren't plugged in.",
    "When you do 99% of the work and the other person writes the title.",
    "The awkward silence when no one wants to present first.",
    "When your group partner says 'I'll do it later' the night before it's due.",
    "Trying to merge a Google Doc when everyone is typing at once.",
    "When someone deletes your paragraph by accident.",
    "Assigning the easiest slide to the person who does nothing.",
    "When the teacher lets you pick your own groups.",
    "Having a secret group chat without the one annoying member.",
    "When you have to present and your partner is absent.",
    "Pretending to agree with a bad idea just to get the project over with.",
    "Waking up and calculating the minimum amount of time you need to get ready.",
    "When you fall asleep on the bus and wake up in a different zip code.",
    "Running for the bus and the driver looks you in the eye and drives away.",
    "When you forget your headphones and have to listen to the bus noise.",
    "Trying to put on a jacket while wearing a backpack.",
    "When you realize you forgot your ID badge at home.",
    "Walking into school and realizing it's Spirit Week and you didn't dress up.",
    "When the bus hits a bump and you fly three feet in the air.",
    "Trying to eat breakfast while running to first period.",
    "When you realize you wore two different shoes.",
    "When the teacher says 'See me after class'.",
    "Trying to sound smart during a Socratic Seminar.",
    "When you get a paper cut from a worksheet.",
    "The joy of a snow day (or an e-learning day where the Wi-Fi is 'down').",
    "When you have to watch a movie in class but the audio is out of sync.",
    "Trying to read the whiteboard when the marker is running out of ink.",
    "When the teacher erases the one thing you hadn't written down yet.",
    "Realizing you have a hole in your sock during gym class.",
    "When you walk into a spiderweb in the hallway.",
    "Trying to explain a meme to a teacher.",
    "When you get the seat next to the electrical outlet.",
    "The panic when the teacher starts passing back graded tests.",
    "When you confidently give an answer and it's completely wrong.",
    "Trying to open a milk carton without exploding it everywhere.",
    "When you see a dog on school grounds and everyone loses their minds.",
    "The feeling of taking off your backpack after a long day.",
    "When you have to use a hall pass that looks like a literal piece of trash.",
    "Trying to be quiet in the library but your chair squeaks.",
    "When the fire alarm goes off during a test and you feel blessed.",
    "Realizing you have homework on a Sunday night at 10 PM."
];


// --- 2. SHUFFLE LOGIC ---
let activeDeck = [];

function shuffleDeck() {
    console.log("Refilling and Shuffling Deck...");
    activeDeck = [...masterDeck]; // Copy master to active
    // Fisher-Yates Shuffle
    for (let i = activeDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activeDeck[i], activeDeck[j]] = [activeDeck[j], activeDeck[i]];
    }
}

function drawCard() {
    if (activeDeck.length === 0) {
        shuffleDeck();
    }
    return activeDeck.pop();
}

// Initial Shuffle
shuffleDeck();


// --- 3. SOCKET LOGIC ---
io.on('connection', (socket) => {
    console.log('User connected: ' + socket.id);

    // Join Game
    socket.on('joinGame', (name) => {
        const existing = players.find(p => p.id === socket.id);
        if (!existing) {
            players.push({ id: socket.id, name: name, score: 0, hand: [] });
            
            // Deal initial hand from shuffled deck
            const player = players.find(p => p.id === socket.id);
            while(player.hand.length < 5) {
                player.hand.push(drawCard());
            }
            
            io.to(socket.id).emit('yourHand', player.hand);
            io.emit('updatePlayerList', players);
        }
    });

    // Start Round
    socket.on('startRound', () => {
        if (players.length < 2) return; 

        submissions = []; 
        if (currentJudgeIndex >= players.length) currentJudgeIndex = 0;
        
        const judge = players[currentJudgeIndex];
        const currentMeme = memeImages[Math.floor(Math.random() * memeImages.length)];

        io.emit('newRound', {
            judgeId: judge.id,
            memeUrl: currentMeme
        });
        
        currentJudgeIndex = (currentJudgeIndex + 1) % players.length;
    });

    // Play Card
    socket.on('playCard', (cardText) => {
        // Security Check: Already played? Judge?
        const alreadyPlayed = submissions.find(s => s.playerId === socket.id);
        const judgeId = players[currentJudgeIndex] ? players[currentJudgeIndex].id : null;

        if (alreadyPlayed || socket.id === judgeId) return;

        // 1. Record Submission
        submissions.push({ playerId: socket.id, text: cardText });

        // 2. Remove played card and Deal replacement
        let player = players.find(p => p.id === socket.id);
        if (player) {
            const idx = player.hand.indexOf(cardText);
            if (idx > -1) player.hand.splice(idx, 1);
            player.hand.push(drawCard()); // Draw from shuffled deck
            io.to(socket.id).emit('yourHand', player.hand);
        }

        // 3. Notify everyone (Face Down)
        io.emit('cardPlayedAnonymously', submissions.length);

        // 4. Reveal if everyone (except judge) has played
        // Logic: (TotalPlayers - 1 Judge)
        if (submissions.length >= players.length - 1) {
            io.emit('revealCards', submissions);
        }
    });

    // Judge Choice
    socket.on('judgeChoice', (winnerId) => {
        let winner = players.find(p => p.id === winnerId);
        if (winner) {
            winner.score += 1;
            io.emit('roundWinner', winner.name);
            io.emit('updatePlayerList', players);
        }
    });

    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        io.emit('updatePlayerList', players);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
