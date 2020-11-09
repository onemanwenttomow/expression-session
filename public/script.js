const video = document.getElementById("video");
const expressionContainer = document.getElementById("expression");
const spinner = document.getElementById("spinner-container");
const challenges = document.getElementById("challenges");
const completedSoundEffect = new Audio("sound/coin-2.wav");
const winningSoundEffect = new Audio("sound/win-2.wav");

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
const emojiArray = [...Array(10)].map((el) => {
    return {
        completed: false,
        emoji: emojisArray[Math.floor(Math.random() * emojisArray.length)],
        current: false,
    };
});
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
    }
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
        emojis: emojiArray,
        playerWon: false,
    },
    mounted: function () {
        video.addEventListener("play", () => {
            expressionContainer.classList.remove("hidden");
            video.classList.remove("hidden");
            spinner.classList.add("hidden");
            setInterval(this.checkForExpression, 100);
        });
    },
    methods: {
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
        },
        getCurrentChallenge: function (expression) {
            const currentChallenge = this.emojis.find((emoji) => !emoji.completed);
            if (!currentChallenge) {
                !this.playerWon && winningSoundEffect.play();
                this.playerWon = true;
                return;
            }
            currentChallenge.current = "true";
            this.userMatchedExpression(expression);
        },
        userMatchedExpression: function (expression) {
            const currentChallenge = this.emojis.find((emoji) => !emoji.completed);
            if (expression === currentChallenge.emoji) {
                currentChallenge.completed = true;
                completedSoundEffect.play();
            }
        },
    },
});
