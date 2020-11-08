const video = document.getElementById('video');
const expressionContainer = document.getElementById('expression');
const spinner = document.getElementById('spinner-container');
const challenges = document.getElementById('challenges');
const expressionOptions = {
    neutral: "😐",
    happy: "😃",
    sad: "😥",
    angry: "😠",
    fearful: "😱",
    disgusted: "🤢",
    surprised: "😮"
}
const emojisArray = Object.values(expressionOptions);
console.log('emojisArray: ',emojisArray);
let randomEmojis = [...Array(10)].map(el => {
    return {
        completed: false,
        emoji: emojisArray[Math.floor(Math.random() * emojisArray.length)]
    }
})
console.log('randomEmojis: ',randomEmojis);

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(getMedia)

const constraints = {
    audio: false,
    video: true
}

async function getMedia() {
    let stream = null;
    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
    } catch (err) {
        console.error(err);
    }
}

video.addEventListener('play', () => {
    expressionContainer.classList.remove('hidden');
    video.classList.remove('hidden');
    spinner.classList.add('hidden');
    challenges.innerText = randomEmojis.map(ob => ob.emoji);
    setInterval(async () => {
        const detections = await faceapi.detectSingleFace(
            video,
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceExpressions();
        const expression = getPredictedExpression(detections);
        if (!expression) {
            return;
        }
        console.log('expression: ', expression);
        expressionContainer.innerText = expressionOptions[expression];
    }, 100)
})

function getPredictedExpression(guess) {
    const obj = guess?.expressions;
    if (!obj) {
        return;
    }
    const arr = Object.keys(obj).map(exp => {
        return [exp, obj[exp]]
    }).sort((a, b) => b[1] - a[1])
    return arr[0][0];
}