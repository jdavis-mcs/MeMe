const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let players = [];
let currentJudgeIndex = 0;
let submissions = []; 

// A deck of school-safe captions
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

// Reliable Image Placeholders (To ensure images definitely show up)
// In production, you can replace these with real image URLs later.
const memeImages = [
    "https://upload.wikimedia.org/wikipedia/en/9/9a/Trollface_non-free.png",
    "https://upload.wikimedia.org/wikipedia/commons/e/e3/Buddy_christ.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/ff/Deep_in_thought.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3b/Paris_Tuileries_Garden_Facepalm_statue.jpg"
];

io.on('connection', (socket) => {
    console.log('User connected: ' + socket.id);

    socket.on('joinGame', (name) => {
        // Prevent duplicate joins from same browser
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

    socket.on('startRound', () => {
        if (players.length < 2) return; // Need at least 2 people to play

        submissions = []; 
        
        // Safety check: ensure index is valid
        if (currentJudgeIndex >= players.length) currentJudgeIndex = 0;
        
        // Pick the Judge
        const judge = players[currentJudgeIndex];
        
        // Pick a Meme
        const currentMeme = memeImages[Math.floor(Math.random() * memeImages.length)];

        console.log(`Starting round. Judge is ${judge.name}. Meme is ${currentMeme}`);

        // Broadcast new round info
        io.emit('newRound', {
            judgeId: judge.id,
            memeUrl: currentMeme
        });
        
        // Move index for next time
        currentJudgeIndex = (currentJudgeIndex + 1) % players.length;
    });

    socket.on('playCard', (cardText) => {
        // Prevent playing if round hasn't started (no judge)
        // But for simplicity, we just accept and check length
        submissions.push({ playerId: socket.id, text: cardText });

        // Remove card from server-side hand and deal new one
        let player = players.find(p => p.id === socket.id);
        if (player) {
            const idx = player.hand.indexOf(cardText);
            if (idx > -1) player.hand.splice(idx, 1);
            player.hand.push(deck[Math.floor(Math.random() * deck.length)]);
            io.to(socket.id).emit('yourHand', player.hand);
        }

        // Logic: If everyone (Player Count - 1 Judge) has played
        if (submissions.length >= players.length - 1) {
            io.emit('revealCards', submissions);
        }
    });

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

