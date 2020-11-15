const video = document.getElementById("video");
const expressionContainer = document.getElementById("expression");
const spinner = document.getElementById("spinner-container");
const challenges = document.getElementById("challenges");
const completedSoundEffect = new Audio("sound/coin-2.wav");
const winningSoundEffect = new Audio("sound/win-2.wav");
const linkForFavicon = document.querySelector(`head > link[rel='icon']`);

const expressionOptions = {
    neutral: "😐",
    happy: "😃",
    sad: "😥",
    angry: "😠",
    fearful: "😱",
    disgusted: "🤢",
    surprised: "😮",
};
const emojisArray = Object.values(expressionOptions);
const emojiArray = generateRandomEmojiArray();
console.log("emojisArray: ", emojisArray);

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("/models"),
]).then(getMedia);

const constraints = {
    audio: false,
    video: true,
};

async function getMedia() {
    let stream = null;
    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
    } catch (err) {
        console.error(err);
        console.log("setting string...");
        spinner.innerHTML =
            "<h1>Sorry, something went wrong. Please try again here <a href='https://expression-session.herokuapp.com/'>here</a></h1>";
    }
}

function generateRandomEmojiArray() {
    return [...Array(10)].map((el) => {
        return {
            completed: false,
            emoji: emojisArray[Math.floor(Math.random() * emojisArray.length)],
            current: false,
        };
    });
}

function getPredictedExpression(guess) {
    const obj = guess?.expressions;
    if (!obj) {
        return;
    }
    const arr = Object.keys(obj)
        .map((exp) => {
            return [exp, obj[exp]];
        })
        .sort((a, b) => b[1] - a[1]);
    return arr[0][0];
}

new Vue({
    el: "#challenges",
    data: {
        emojis: [],
        gameStarted: false,
        playerWon: false,
        timeSinceLastCompletition: 0,
    },
    mounted: function () {
        video.addEventListener("play", () => {
            expressionContainer.classList.remove("hidden");
            video.classList.remove("hidden");
            spinner.classList.add("hidden");
            this.startGame();
            setInterval(this.checkForExpression, 100);
        });
    },
    computed: {
        current: function () {
            let currentChallenge = this.emojis.find((emoji) => !emoji.completed);
            return currentChallenge ? currentChallenge.emoji : "✔️";
        },
        completed: function () {
            return this.emojis.filter((emoji) => emoji.completed);
        },
        upComing: function () {
            const upComingEmojisArray = this.emojis.filter((emoji) => !emoji.completed).slice(1);
            return upComingEmojisArray.length === 0 && this.playerWon
                ? [{ emoji: "Play Again?" }]
                : upComingEmojisArray;
        },
    },
    methods: {
        newGame: function () {
            if (!this.playerWon) {
                return;
            }
            this.startGame();
        },
        startGame: function () {
            this.gameStarted = true;
            this.emojis = generateRandomEmojiArray();
            this.emojis[0].current = true;
            this.playerWon = false;
            this.timeSinceLastCompletition = 0;
        },
        checkForExpression: async function () {
            const detections = await faceapi
                .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions();
            const expression = getPredictedExpression(detections);
            if (!expression) {
                return;
            }
            expressionContainer.innerText = expressionOptions[expression];
            this.getCurrentChallenge(expressionOptions[expression]);
            this.updateFavicon(expressionOptions[expression]);
        },
        updateFavicon(expression) {
            let newFavicon = this.faviconTemplate(expression);
            console.log('newFavicon: ',newFavicon);
            linkForFavicon.setAttribute(`href`, `data:image/svg+xml,${newFavicon}`);
        },
        faviconTemplate: function (icon) {
            return `
                <svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22>
                    <text y=%22.9em%22 font-size=%2290%22>
                    ${icon}
                    </text>
                </svg>
                `.trim();
        },
        getCurrentChallenge: function (expression) {
            const currentChallenge = this.emojis.find((emoji) => !emoji.completed);
            if (!currentChallenge) {
                !this.playerWon && winningSoundEffect.play();
                this.playerWon = true;
                return;
            }
            currentChallenge.current = true;
            this.userMatchedExpression(expression, currentChallenge);
        },
        userMatchedExpression: function (expression, currentChallenge) {
            const date = new Date();
            const timeInMs = date.getTime();
            if (timeInMs - this.timeSinceLastCompletition <= 1000) {
                return;
            }
            if (expression === currentChallenge.emoji) {
                currentChallenge.completed = true;
                currentChallenge.current = false;
                this.timeSinceLastCompletition = timeInMs;
                completedSoundEffect.play();
            }
        },
    },
});
