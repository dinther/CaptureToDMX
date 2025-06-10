import {EnttecPro} from './enttec_pro_usb.js';

const startElem = document.getElementById("startBtn");
const videoElem = document.getElementById("video");
const canvasElem = document.querySelector("canvas");
var ctx;
const stopElem = document.getElementById("endBtn");
const dmxElem = document.getElementById("dmx");
const lineElem = document.getElementById("line");
const blurSlider = document.getElementById("blur");
const hueSlider = document.getElementById("hue");
const saturationSlider = document.getElementById("saturation");
const brightnessSlider = document.getElementById("brightness");
const contrastSlider = document.getElementById("contrast");
const linePosSlider = document.getElementById("linepos");
const fpsElem = document.getElementById("fps");

var startTime;
var frameCount = 0;
var vh = 0;
var dmxDevice = null;

const statusLogElm = document.getElementById('statusLogElm');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');

connectBtn.addEventListener('click', async () => {
  try{
    let serialport = await navigator.serial.requestPort();
    if (serialport){
        dmxDevice = new EnttecPro(serialport, {channels: 97, auto: true});
        window.dmxDevice = dmxDevice;
    }
  } catch (error){
    console.log('connect Device', error);
  }
});
    
disconnectBtn.addEventListener('click', async () => {
  try{
    statusLogElm.innerHTML += 'Closing devices....';
    for (let j = 0; j < DMXDevices.length; j++) {
      await DMXDevices[j].close();
    }
    statusLogElm.innerHTML += 'closed<br>';
    disconnectBtn.disabled = true;
  } catch (err){
    console.log(err);
  }
});

document.addEventListener('DOMContentLoaded', async () => {

blurSlider.addEventListener('input', (evt) => { ctx.filter = 'blur('+blurSlider.value+'px)' }, false);
hueSlider.addEventListener('input', (evt) => { ctx.filter = 'hue-rotate('+hueSlider.value+'deg)' }, false);
saturationSlider.addEventListener('input', (evt) => { ctx.filter = 'saturate('+saturationSlider.value+'%)' }, false);
brightnessSlider.addEventListener('input', (evt) => { ctx.filter = 'brightness('+brightnessSlider.value+'%)' }, false);
contrastSlider.addEventListener('input', (evt) => { ctx.filter = 'contrast('+contrastSlider.value+'%)' }, false);
linePosSlider.addEventListener('input', (evt) => {
  lineElem.style.top = linePosSlider.value+'%';
  vh = videoElem.videoHeight * linePosSlider.value * 0.01;
  //linePos = linePosSlider.value * 0.01;

}, false);

const samples = 32;
const sampleLeftMargin =20;
const sampleRightMargin=20;

for (let i=0; i<samples; i++){
  let sample = document.createElement('div');
  let label = document.createElement('div');
  label.innerText = (i*3)+1;
  sample.appendChild(label);
  sample.appendChild(document.createElement('div'));
  sample.appendChild(document.createElement('div'));
  sample.appendChild(document.createElement('div'));
  sample.appendChild(document.createElement('div'));
  dmxElem.appendChild(sample);
}

const displayMediaOptions = {
  video: {
    displaySurface: "window",
    surfaceSwitching: "include",
    selfBrowserSurface: "exclude",
    cursor: "motion",
  },
  audio: false,
};

startElem.addEventListener('click', (evt) => { startCapture(); }, false);
stopElem.addEventListener('click', (evt) => { stopCapture(); }, false);

function easeInSine( t ) {
    //return -1 * Math.cos( t * ( Math.PI / 2 ) ) + 1;
    return t * t;
}

async function startCapture() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    
    const cropElem = document.querySelector("#crop");
    const cropTarget = await CropTarget.fromElement(cropElem);
    const [track] = stream.getVideoTracks();
    // Crop video track
    //await track.cropTo(cropTarget);
    //await cropTarget.BrowserCaptureMediaStreamTrack.cropTo(cropTarget);
    
    
    //const restrictionTarget = await RestrictionTarget.fromElement(demoElem);
    //await track.restrictTo(restrictionTarget);
    videoElem.srcObject = stream;
    
    // Wait for the video metadata to be loaded
    videoElem.addEventListener('loadedmetadata', () => {
      // Set the canvas dimensions based on the video dimensions
      canvasElem.width = videoElem.videoWidth;
      canvasElem.height = videoElem.videoHeight;
      vh = videoElem.videoHeight * 0.5;
      
      // Draw the video stream on the canvas
      function draw(timeStamp) {
        if (ctx) {
            ctx.drawImage(videoElem, 0, 0, canvasElem.width, canvasElem.height);
            frameCount++;
            if(timeStamp > startTime + 1000){
                fpsElem.innerText = frameCount;
                frameCount = 0;
                startTime = timeStamp;
            }
            let data = ctx.getImageData(0, vh, videoElem.videoWidth-1, 1).data;
            let step = Math.floor((videoElem.videoWidth - sampleLeftMargin - sampleRightMargin) / samples);
            let channel = 1;
            let sampleIndex = 0;
            for (let i = sampleLeftMargin; i < videoElem.videoWidth; i += step) {
                let r = Math.floor(data[(i * 4)] * easeInSine(data[(i * 4)]/255));
                let g = Math.floor(data[(i * 4) + 1] * easeInSine(data[(i * 4) + 1]/255));
                let b = Math.floor(data[(i * 4) + 2] * easeInSine(data[(i * 4) + 2]/255));
                if (dmxDevice) dmxDevice.setDMX(channel, [r,g,b]);
                
                let sample = dmxElem.children[sampleIndex]; 
                //sample.children[1].innerText = r;
                //sample.children[2].innerText = g;
                //sample.children[3].innerText = b;
                sample.style.backgroundColor = 'rgb('+r+','+g+','+b+')';
                
                channel+=3;
                sampleIndex++;
                if (sampleIndex>=samples){ break; }
            }
        } else {
            ctx = canvasElem.getContext('2d', {
              willReadFrequently: true,
            });
        }
        requestAnimationFrame(draw); // Continuously draw the stream
      }
      startTime = performance.now();
      draw(startTime);
    });
    
  } catch (err) {
    console.error(err);
  }
}

function stopCapture(evt) {
  let tracks = videoElem.srcObject.getTracks();
  tracks.forEach((track) => track.stop());
  videoElem.srcObject = null;
}

  });	
