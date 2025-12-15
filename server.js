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

// --- CONTENT: SCHOOL SAFE CAPTIONS ---
const deck = [
    // --- TECHNOLOGY STRUGGLES ---
    "When you have 50 tabs open and your computer sounds like a jet engine.",
    "Forgetting your password immediately after changing it.",
    "When the teacher says 'turn and talk' but you have no friends in that class.",
    "Closing the tab just as the page finally loads.",
    "When you accidentally like a post from 3 years ago.",
    "Trying to look busy when the teacher walks past your screen.",
    "When the projector doesn't work and the teacher calls the 'tech expert' student.",
    "Using your phone under the desk at brightness level 1%.",
    "When you hear your own voice echoing on the Zoom call.",
    "Googling the answers and finding a Quizlet with the exact same test.",

    // --- ACADEMIC PAIN ---
    "When the teacher says 'The test will be easy' and the first question is in a different language.",
    "Looking at the clock and realizing only 2 minutes have passed.",
    "When you raise your hand and then forget what you were going to say.",
    "Getting a 99% and being mad about the one point you missed.",
    "When the teacher erases the board before you finished copying the notes.",
    "Pretending to write notes so the teacher doesn't call on you.",
    "When the syllabus says 'No late work accepted' but you try anyway.",
    "Using 'thus' and 'furthermore' to sound smart in an essay.",
    "When you read the instructions after finishing the entire assignment.",
    "Realizing you have a test next period that you completely forgot about.",

    // --- SOCIAL & HALLWAY ---
    "When you wave at someone and they weren't waving at you.",
    "Trying to walk through the hallway when the freshman are blocking the path.",
    "When you see a fight break out and suddenly everyone is a camera operator.",
    "The awkward eye contact with a teacher in the hallway.",
    "When your stomach growls during a silent reading period.",
    "Trying to unzip your backpack quietly but it sounds like a chainsaw.",
    "When you drop your metal water bottle in the middle of a lecture.",
    "Wearing a hoodie when it's 90 degrees outside just for the vibes.",
    "When you accidentally call the teacher 'Mom'.",
    "Holding the door for someone who is just a little too far away.",

    // --- LUNCH & FOOD ---
    "When the vending machine eats your dollar.",
    "Opening a bag of chips and the whole class turns to look at you.",
    "When you forget your lunch and have to survive on air.",
    "Trading the best item in your lunch like it's the stock market.",
    "When the cafeteria pizza is actually just cardboard with cheese.",
    "Drinking water like you've been in the desert for 40 days.",
    "When someone asks 'Can I have a piece of gum?' and you have to hide the pack.",
    "Trying to eat a crunchy snack while the teacher is talking.",
    "When you drop your fork and the cafeteria goes silent.",
    "Rushing to the lunch line to beat the other classes.",

    // --- SPORTS & PE ---
    "When the gym teacher joins the game and takes it way too seriously.",
    "Getting hit in the face with a dodgeball.",
    "Running the mile and questioning your entire existence.",
    "When you pretend to be injured to get out of gym class.",
    "Being the last one picked for the team.",
    "When the PE teacher says 'Just one more lap' for the 5th time.",
    "Wearing jeans on gym day and regretting everything.",
    "When you actually score a goal and look around to see if anyone saw it.",
    "Trying to change in the locker room in 30 seconds flat.",
    "When the ball gets stuck in the rafters and everyone cheers.",

    // --- UNSORTED ---
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
    "When you explain an answer and the teacher says 'No', but then the next kid says the same thing and gets it right."
];

// --- CONTENT: RELIABLE MEME IMAGES ---
const memeImages = [
    "1.jpg",
    "2.jpg",
    "3.jpg",
    "4.jpg",
    "5.jpg",
    "6.jpg",
    "7.jpg",
    "8.jpg",
    "9.jpg",
    "10.jpg",
    "11.jpg",
    "12.jpg",
    "13.jpg",
    "14.jpg",
    "15.jpg",
    "16.jpg",
    "17.jpg",
    "18.jpg",
    "19.jpg",
    "20.jpg"
];


io.on('connection', (socket) => {
    console.log('User connected: ' + socket.id);

    // 1. Join Game
    socket.on('joinGame', (name) => {
        const existing = players.find(p => p.id === socket.id);
        if (!existing) {
            players.push({ id: socket.id, name: name, score: 0, hand: [] });
            
            // Deal initial hand
            const player = players.find(p => p.id === socket.id);
            while(player.hand.length < 5) {
                player.hand.push(deck[Math.floor(Math.random() * deck.length)]);
            }
            
            io.to(socket.id).emit('yourHand', player.hand);
            io.emit('updatePlayerList', players);
        }
    });

    // 2. Start Round
    socket.on('startRound', () => {
        if (players.length < 2) return; // Need at least 2 people

        submissions = []; 
        
        // Safety check index
        if (currentJudgeIndex >= players.length) currentJudgeIndex = 0;
        
        const judge = players[currentJudgeIndex];
        const currentMeme = memeImages[Math.floor(Math.random() * memeImages.length)];

        // Broadcast new round
        io.emit('newRound', {
            judgeId: judge.id,
            memeUrl: currentMeme
        });
        
        // Rotate Judge for next time
        currentJudgeIndex = (currentJudgeIndex + 1) % players.length;
    });

    // 3. Play Card
    socket.on('playCard', (cardText) => {
        // CHECK 1: Already played?
        const alreadyPlayed = submissions.find(s => s.playerId === socket.id);
        if (alreadyPlayed) return;

        // CHECK 2: Is Judge? (Optional server-side validation)
        // ... (Skipping complex check for simplicity, relies on client UI)

        // Add submission
        submissions.push({ playerId: socket.id, text: cardText });

        // Update Hand
        let player = players.find(p => p.id === socket.id);
        if (player) {
            const idx = player.hand.indexOf(cardText);
            if (idx > -1) player.hand.splice(idx, 1);
            player.hand.push(deck[Math.floor(Math.random() * deck.length)]);
            io.to(socket.id).emit('yourHand', player.hand);
        }

        // NOTIFY: Card played (Face down)
        io.emit('cardPlayedAnonymously', submissions.length);

        // CHECK: End of round?
        // (Players - 1 Judge)
        if (submissions.length >= players.length - 1) {
            io.emit('revealCards', submissions);
        }
    });

    // 4. Judge Choice
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




