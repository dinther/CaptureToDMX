import {EnttecPro} from './enttec_pro_usb.js';
import {SamplerLine} from './sampler.js';

const startElem = document.getElementById("startBtn");
const containerElem = document.getElementById("container");
const videoElem = document.getElementById("video");
const canvasElem = document.querySelector("canvas");
canvasElem.width = 700;
canvasElem.height = 400;
var ctx;
const stopElem = document.getElementById("endBtn");
const dmxElem = document.getElementById("dmx");
const lineElem = document.getElementById("line");
const blurSlider = document.getElementById("blur");
const hueSlider = document.getElementById("hue");
const saturationSlider = document.getElementById("saturation");
const brightnessSlider = document.getElementById("brightness");
const contrastSlider = document.getElementById("contrast");
const visualsCheckbox = document.getElementById("visuals");
const biasDownCheckbox = document.getElementById("biasdown");
const dmxBar = document.getElementById("dmxbar");
const linePosSlider = document.getElementById("linepos");
const fpsElem = document.getElementById("fps");

var startTime;
var frameCount = 0;
var vh = 0;
var dmxDevice = new EnttecPro(null, {channels: 96, auto: true});
window.dmxDevice = dmxDevice;

var blurFilter = '';
var hueFilter = '';
var saturationFilter = '';
var brightnessFilter = '';
var contrastFilter = '';

const samples = 32;
const sampleLeftMargin =20;
const sampleRightMargin=20;

var samplers = [];
window.samplers = samplers;

const statusLogElm = document.getElementById('statusLogElm');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');

function setFilters(){
  let filters = blurFilter + hueFilter + saturationFilter + brightnessFilter + contrastFilter;
  if (ctx){
    ctx.filter = filters;
  }
  console.log(filters);
}

connectBtn.addEventListener('click', async () => {
  try{
    let serialport = await navigator.serial.requestPort();
    if (serialport){
        dmxDevice = new EnttecPro(serialport, {channels: 96, auto: true});
        window.dmxDevice = dmxDevice;
        disconnectBtn.disabled = false;
        connectBtn.disabled = true;
    }
  } catch (error){
    console.log('connect Device', error);
  }
});
    
disconnectBtn.addEventListener('click', async () => {
  try{
      await dmxDevice.close();
      disconnectBtn.disabled = true;
      connectBtn.disabled = false;
  } catch (err){
    console.log(err);
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  blurSlider.addEventListener('input', (evt) => { blurFilter = blurSlider.value==0? '' : ' blur('+blurSlider.value+'px)'; setFilters(); }, false);
  blurSlider.parentElement.addEventListener('dblclick', ()=>{ blurSlider.value = 0; blurFilter = ''; setFilters();});
  hueSlider.addEventListener('input', (evt) => { hueFilter = hueSlider.value==0? '' : ' hue-rotate('+hueSlider.value+'deg)'; setFilters(); }, false);
  hueSlider.parentElement.addEventListener('dblclick', ()=>{ hueSlider.value = 0; hueFilter=''; setFilters();});
  saturationSlider.addEventListener('input', (evt) => { saturationFilter = saturationSlider.value==100? '' : ' saturate('+saturationSlider.value+'%)'; setFilters(); }, false);
  saturationSlider.parentElement.addEventListener('dblclick', ()=>{ saturationSlider.value = 100; saturationFilter=''; setFilters();});
  brightnessSlider.addEventListener('input', (evt) => { brightnessFilter = brightnessSlider.value==100? '' : ' brightness('+brightnessSlider.value+'%)'; setFilters(); }, false);
  brightnessSlider.parentElement.addEventListener('dblclick', ()=>{ brightnessSlider.value = 100; brightnessFilter=''; setFilters();});
  contrastSlider.addEventListener('input', (evt) => { contrastFilter = contrastSlider.value==100? '' : ' contrast('+contrastSlider.value+'%)'; setFilters(); }, false);
  contrastSlider.parentElement.addEventListener('dblclick', ()=>{ contrastSlider.value = 100; contrastFilter=''; setFilters();});
  visualsCheckbox.addEventListener('input', (evt) => {
    dmxBar.style.display = visualsCheckbox.checked? '' : 'none';
    containerElem.style.display = visualsCheckbox.checked? '' : 'none';
  });
  biasDownCheckbox.addEventListener('input', (evt) => {
    samplers.forEach(sampler =>{
      sampler.options.ledMode = biasDownCheckbox.checked;
    });
  });
  linePosSlider.addEventListener('input', (evt) => {
    lineElem.style.top = linePosSlider.value+'%';
    vh = videoElem.videoHeight * linePosSlider.value * 0.01;
  }, false);

  startElem.addEventListener('click', (evt) => { startCapture(); }, false);
  stopElem.addEventListener('click', (evt) => { stopCapture(); }, false);

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

  samplers.push(new SamplerLine(containerElem, canvasElem, {points: 16, size: 16, ledMode:true, startChannel:1}, 20, 10, 20, 90));
  samplers.push(new SamplerLine(containerElem, canvasElem, {points: 16, size: 16, ledMode:true, startChannel:49}, 80,90, 80, 10));
  //samplers.push(new SamplerLine(containerElem, canvasElem, {points: 8, size: 16, ledMode:false, startChannel:49}, 51,70, 74, 30));
  //samplers.push(new SamplerLine(containerElem, canvasElem, {points: 8, size: 16, ledMode:false, startChannel:73}, 76,30, 99, 70));

  // eyebrow layout ^^
  //samplers.push(new SamplerLine(containerElem, canvasElem, {points: 8, size: 16, ledMode:false, startChannel:1}, 1,70, 24, 30));
  //samplers.push(new SamplerLine(containerElem, canvasElem, {points: 8, size: 16, ledMode:false, startChannel:25}, 26,30, 49, 70));
  //samplers.push(new SamplerLine(containerElem, canvasElem, {points: 8, size: 16, ledMode:false, startChannel:49}, 51,70, 74, 30));
  //samplers.push(new SamplerLine(containerElem, canvasElem, {points: 8, size: 16, ledMode:false, startChannel:73}, 76,30, 99, 70));
});	


async function startCapture() {
  try {
    const displayMediaOptions = {
      video: {
        displaySurface: "window",
        surfaceSwitching: "include",
        selfBrowserSurface: "exclude",
        cursor: "motion",
      },
      audio: false,
    };

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

      samplers.forEach(sampler=>{
        sampler.update();
      });
      
      // Draw the video stream on the canvas
      function draw(timeStamp) {
        if (ctx) {
            if (videoElem.srcObject == null){
              ctx.clearRect(0, 0, canvasElem.width, canvasElem.height); 
            } else {
              ctx.drawImage(videoElem, 0, 0, canvasElem.width, canvasElem.height);
            }
            frameCount++;
            if(timeStamp > startTime + 1000){
                fpsElem.innerText = frameCount;
                frameCount = 0;
                startTime = timeStamp;
            }
            let data = ctx.getImageData(0, 0, canvasElem.width, canvasElem.height).data;
            samplers.forEach(sampler=>{
              sampler.sample(data, dmxDevice);
            });

            let step = Math.floor((canvasElem.width - sampleLeftMargin - sampleRightMargin) / samples);
            //let channel = 1;
            if (visualsCheckbox.checked){
              let sampleIndex = 0;
              for (let i = 0; i < samples; i ++) {
                  let sample = dmxElem.children[i]; 
                  let channel = 1 + (i * 3);
                  //sample.children[1].innerText = dmxDevice.getDMX(channel);
                  //sample.children[2].innerText = dmxDevice.getDMX(channel+1);
                  //sample.children[3].innerText = dmxDevice.getDMX(channel+2);
                  sample.style.backgroundColor = 'rgb('+dmxDevice.getDMX(channel)+','+dmxDevice.getDMX(channel+1)+','+dmxDevice.getDMX(channel+2)+')';
              }
            }
        } else {
            ctx = canvasElem.getContext('2d', {
              willReadFrequently: true,
            });
        }
        if (videoElem.srcObject != null){
          requestAnimationFrame(draw); // Continuously draw the stream
        }
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
  fpsElem.innerText = 0;
}


