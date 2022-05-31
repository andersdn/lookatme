const bodyPix = require('@tensorflow-models/body-pix');
const { ipcRenderer } = require('electron');
require('@tensorflow/tfjs');

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const nocamera = document.getElementById('nocamera');
const windowFrame = document.getElementsByTagName('main')[0]

const windowTopBar = document.createElement('div');
windowTopBar.className = 'windowTopBar';
windowTopBar.style.webkitAppRegion = 'drag';
document.getElementById('mainWindow').appendChild(windowTopBar);

let selectedCamera = false;
let selectedFilter = 'blur';
let selectedSize = 0.5;
let selectedIgnoreMouse = false;
let selectedMirrorCamera = false;

let currentStream;

windowTopBar.onmouseover = windowTopBar.onmouseout = handler;

function handler(event) {
  if(selectedIgnoreMouse){
    let type = event.type;
    ipcRenderer.send(
      'setIgnoreMouseEvents',
      type === 'mouseout' ? true : false
    );
  }
}

async function perform(net) {

// console.log('selectedFilter',selectedFilter)

  if (selectedFilter === 'blur' || selectedFilter === 'blurblur') {
    const segmentation = await net.segmentPerson(video);
    const backgroundBlurAmount = selectedFilter === 'blurblur' ? 10 : 5;
    const edgeBlurAmount = 4;
    const flipHorizontal = false;

    video.style.display = 'none';
    canvas.style.display = 'block';

    bodyPix.drawBokehEffect(
      canvas,
      video,
      segmentation,
      backgroundBlurAmount,
      edgeBlurAmount,
      flipHorizontal
    );
    requestAnimationFrame(()=>perform(net));
  } else if (selectedFilter === 'clip') {
    const segmentation = await net.segmentPerson(video);

    video.style.display = 'none';
    canvas.style.display = 'block';
    canvas.width = video.width;
    canvas.height = video.height;

    let context = canvas.getContext('2d');
    context.drawImage(video, 0, 0);
    let imageData = context.getImageData(0, 0, video.width, video.height);

    let pixel = imageData.data;
    for (let p = 0; p < pixel.length; p += 4) {
      if (segmentation.data[p / 4] == 0) {
        pixel[p + 3] = 0;
      }
    }
    context.imageSmoothingEnabled = true;
    context.filter = 'drop-shadow(0 0 20px rgba(0,0,0,0.25))';

    context.putImageData(imageData, 0, 0);
    context.drawImage(canvas, 0, 0);
    requestAnimationFrame(()=>perform(net));
  } else {
    video.style.display = 'block';
    canvas.style.display = 'none';
  }

  // setTimeout(() => perform(net), 50);

}

function loadBodyPix() {
  options = {
    multiplier: 0.75,
    // stride: 32,
    quantBytes: 2,

    outputStride: 16,
    // multiplier: 1,
    // quantBytes: 2
  };
  bodyPix
    .load(options)
    .then((net) => perform(net))
    .catch((err) => console.log(err));
}

function stopMediaTracks(stream) {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

const setSize = () => {
  let ar = video.videoHeight / video.videoWidth;
  let baseSize = selectedSize * 640;
  video.width = canvas.width = video.videoWidth;
  video.height = canvas.height = video.videoHeight;

  canvas.style.width = baseSize + 'px';
  canvas.style.height = ar * baseSize + 'px';
  video.style.width = baseSize + 'px';
  video.style.height = ar * baseSize + 'px';

  document.getElementById('mainWindow').style['clip-path'] = 'circle(' + Math.min(baseSize,(ar * baseSize))*0.5 + 'px at center)';

  ipcRenderer.send(
    'set-size',
    JSON.stringify({
      selectedSize: selectedSize,
      width: baseSize,
      height: ar * baseSize,
    })
  );

  ipcRenderer.send(
    'update-settings',
    JSON.stringify({
      selectedSize: selectedSize,
      selectedCamera: selectedCamera,
      selectedFilter: selectedFilter,
      selectedIgnoreMouse: selectedIgnoreMouse,
      selectedMirrorCamera: selectedMirrorCamera
    })
  );

};

const setActiveCamera = (deviceId) => {
  if (typeof currentStream !== 'undefined') {
    stopMediaTracks(currentStream);
  }
  const videoConstraints = {};
  if (deviceId === '') {
    videoConstraints.facingMode = 'environment';
  } else {
    videoConstraints.deviceId = { exact: deviceId };
  }
  selectedCamera = deviceId;

  const constraints = {
    video: videoConstraints,
    audio: false,
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      currentStream = stream;
      video.srcObject = stream;
      video.addEventListener('loadeddata', (event) => {
        loadBodyPix();
        setSize();
      });
      nocamera.style.display = 'none';
      return navigator.mediaDevices.enumerateDevices();
    })
    // .then(gotDevices)
    .catch((error) => {
      nocamera.style.display = 'block';
      console.error(error);
    });
  ipcRenderer.send(
    'update-settings',
    JSON.stringify({
      selectedSize: selectedSize,
      selectedCamera: selectedCamera,
      selectedFilter: selectedFilter,
      selectedIgnoreMouse: selectedIgnoreMouse,
      selectedMirrorCamera: selectedMirrorCamera
    })
  );
};

function gotDevices(mediaDevices) {
  let videoDevices = mediaDevices.filter((vd) => vd.kind === 'videoinput');
  ipcRenderer.send('camera-list', JSON.stringify(videoDevices)); // send request

  if (videoDevices.length === 0) {
    // no devices
    nocamera.style.display = 'block';
  }
  if (videoDevices.length === 1) {
    nocamera.style.display = 'none';
  }
  if (videoDevices.length){
    setActiveCamera(videoDevices[0].deviceId);
  }
}

ipcRenderer.on('set-filter', function (event, newFilter) {
  // console.log('got filter',event,newFilter);
  selectedFilter = newFilter;
  loadBodyPix(); // just incase we were false before
});

ipcRenderer.on('set-size', function (event, newSize) {
  selectedSize = newSize;
  setSize();
});

ipcRenderer.on('set-camera', function (event, deviceId) {
  setActiveCamera(deviceId);
});

ipcRenderer.on('set-ignore-mouse', function (event, shouldIgnoreMouse) {
  selectedIgnoreMouse = shouldIgnoreMouse;

  ipcRenderer.send(
    'update-settings',
    JSON.stringify({
      selectedSize: selectedSize,
      selectedCamera: selectedCamera,
      selectedFilter: selectedFilter,
      selectedIgnoreMouse: selectedIgnoreMouse,
      selectedMirrorCamera: selectedMirrorCamera
    })
  );

});

ipcRenderer.on('set-mirror-camera', function (event, shouldMirrorCamera) {
  selectedMirrorCamera = shouldMirrorCamera;
  if(selectedMirrorCamera){
    document.getElementById('mainWindow').classList.add("mirrorCamera");
  } else {
    document.getElementById('mainWindow').classList.remove("mirrorCamera");
  }
  
  ipcRenderer.send(
    'update-settings',
    JSON.stringify({
      selectedSize: selectedSize,
      selectedCamera: selectedCamera,
      selectedFilter: selectedFilter,
      selectedIgnoreMouse: selectedIgnoreMouse,
      selectedMirrorCamera: selectedMirrorCamera
    })
  );

});



navigator.mediaDevices.enumerateDevices().then(gotDevices);
