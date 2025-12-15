const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// --- GAME STATE ---
let players = []; 
let currentJudgeIndex = 0;
let currentMeme = "";
let submissions = []; 
let roundInProgress = false;

// --- CONTENT: SCHOOL SAFE CAPTIONS ---
// (I will provide a longer list in Part 2 below, paste them here!)
const deck = [
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
    "Thinking it's Friday but it's only Tuesday."
];

// --- CONTENT: MEME IMAGES ---
// Ideally, use hosted URLs. Here are placeholders you can replace with real links.
const memeImages = [
    "https://i.imgflip.com/1ur9b0.jpg", // Distracted Boyfriend
    "https://i.imgflip.com/261o3j.jpg", // Bernie Sanders
    "https://i.imgflip.com/1g8my4.jpg", // Two Buttons
    "https://i.imgflip.com/1h7in3.jpg", // Mocking Spongebob
    "https://i.imgflip.com/4t0m5.jpg",  // Futurama Fry
    "https://i.imgflip.com/gtj5t.jpg",  // Oprah You Get A Car
    "https://i.imgflip.com/1bij.jpg",   // One Does Not Simply
    "https://i.imgflip.com/345v97.jpg", // Cyberpunk Keanu
    "https://i.imgflip.com/28j0te.jpg", // Change My Mind
    "https://i.imgflip.com/9ehk.jpg"    // Success Kid
];

io.on('connection', (socket) => {
    console.log('User connected: ' + socket.id);

    // 1. Join Game
    socket.on('joinGame', (name) => {
        players.push({
            id: socket.id,
            name: name,
            score: 0,
            hand: []
        });
        
        // Deal initial hand (5 cards)
        const player = players.find(p => p.id === socket.id);
        while(player.hand.length < 5) {
            player.hand.push(deck[Math.floor(Math.random() * deck.length)]);
        }

        io.emit('updatePlayerList', players);
        io.to(socket.id).emit('yourHand', player.hand);
    });

    // 2. Start Round
    socket.on('startRound', () => {
        submissions = []; // Clear table
        roundInProgress = true;

        // Rotate Judge
        if (players.length > 0) {
            currentJudgeIndex = (currentJudgeIndex + 1) % players.length;
        }

        // Pick Random Meme
        currentMeme = memeImages[Math.floor(Math.random() * memeImages.length)];

        // Notify everyone
        io.emit('newRound', {
            judgeId: players[currentJudgeIndex].id,
            memeUrl: currentMeme
        });
    });

    // 3. Play Card
    socket.on('playCard', (cardText) => {
        // Find player and remove card from hand
        let player = players.find(p => p.id === socket.id);
        if (player) {
            // Remove played card
            const index = player.hand.indexOf(cardText);
            if (index > -1) {
                player.hand.splice(index, 1);
            }
            // Draw a new card to replace it
            player.hand.push(deck[Math.floor(Math.random() * deck.length)]);
            
            // Update player's private hand
            io.to(socket.id).emit('yourHand', player.hand);
        }

        // Add to submissions
        submissions.push({ playerId: socket.id, text: cardText });

        // Check if everyone (except judge) has played
        // Note: In a real class, you might want a manual "Show Cards" button in case someone is AFK.
        // For now, we auto-reveal when count matches.
        if (submissions.length >= players.length - 1) {
            io.emit('revealCards', submissions);
        }
    });

    // 4. Judge Picks Winner
    socket.on('judgeChoice', (winnerId) => {
        let winner = players.find(p => p.id === winnerId);
        if (winner) {
            winner.score += 1;
            io.emit('updatePlayerList', players);
            io.emit('roundWinner', winner.name);
        }
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        io.emit('updatePlayerList', players);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});