console.log('sanity check!');

console.log(faceapi.nets)

const video = document.getElementById('video');

const constraints = {
    audio: false,
    video: true
}

async function getMedia(constraints) {
    let stream = null;

    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('stream', stream);
        video.srcObject = stream;
        /* use the stream */
    } catch (err) {
    /* handle the error */
        console.error(err);
    }
}

getMedia(constraints);