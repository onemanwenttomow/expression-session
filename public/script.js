const video = document.getElementById('video');

Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    //   faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    //   faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
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
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceExpressions();
        console.log('detections: ', detections[0]?.expressions);
        const obj = detections[0]?.expressions;
        if (!obj) {
            return;
        }
        const arr = Object.keys(obj).map(exp => {
            return [exp, obj[exp]]
        }).sort((a, b) => b[1] - a[1])
        const expression = arr[0][0]
        console.log('expression: ',expression);
        console.log('arr: ',arr);
        console.log('detections: ',detections[0]);
    }, 100)
})
