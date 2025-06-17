class SamplePoint{
    #element;
    channels_r = [];
    channels_g = [];
    channels_b = [];
    #x = 0;
    #y = 0;

    constructor(element, x, y, channel_r, channel_g, channel_b){
        this.#element = element;
        this.#x = x;
        this.#y = y;
        this.addDMXChannelForRed(channel_r);
        this.addDMXChannelForGreen(channel_g);
        this.addDMXChannelForBlue(channel_b);
    }
    writeSample(dmxDevice, r, g, b){
        this.channels_r.forEach(channel => { dmxDevice.setDMX(channel, r); });
        this.channels_g.forEach(channel => { dmxDevice.setDMX(channel, g); });
        this.channels_b.forEach(channel => { dmxDevice.setDMX(channel, b); });
    }
    setXY(x, y){
        this.#x = Math.floor(x);
        this.#y = Math.floor(y);
    }
    addDMXChannelForRed(channel){
        this.channels_r.push(channel);

    }
    addDMXChannelForGreen(channel){
        this.channels_g.push(channel);
    }
    addDMXChannelForBlue(channel){
        this.channels_b.push(channel);
    }
    get element(){
        return this.#element;
    }

    get x(){
        return this.#x;
    }

    get y(){
        return this.#y;
    }    
}


export class SamplerLine{
    #options = {points:2, size: 10, ledMode: false, startChannel:1};
    #startElement;
    #endElement;
    #dragStartPoint = false;
    #dragEndPoint = false;
    #containerElem;
    #canvas;
    #lineElem;
    #samplePoints = [];
    #x1;
    #y1;
    #x2;
    #y2;
    constructor(containerElem, canvas, options, x1, y1, x2, y2){
        Object.assign(this.#options, options);
        this.#options.hs = this.#options.size / 2;
        this.#options.points = Math.max(2, this.#options.points);
        this.#containerElem = containerElem;
        this.#canvas = canvas;
        this.#lineElem = document.createElement('div');
        this.#lineElem .classList.add('sampleline');
        let channel = this.#options.startChannel;
        for (let i=0; i<this.#options.points; i++){
            let marker = document.createElement('div');
            marker.classList.add('mark');
            marker.style.width = this.#options.size + 'px';
            marker.style.height = this.#options.size + 'px';
            marker.style.borderRadius = this.#options.hs + 1 + 'px';
            marker.style.transform = 'translate(0px, -' + this.#options.hs + 'px)';
            this.#lineElem .appendChild(marker);
            this.#samplePoints.push(new SamplePoint(marker, 0, 0, channel++, channel++, channel++));

            if (i==0) {this.#startElement = marker};
            this.#endElement = marker;
        }
        this.setLine(x1,y1,x2,y2);
        this.#containerElem.appendChild(this.#lineElem);
        this.#startElement.addEventListener('pointerdown', e=>{
            this.#dragStartPoint = true;
        });

        this.#endElement.addEventListener('pointerdown', e=>{
            this.#dragEndPoint = true;
        });
        document.body.addEventListener('pointerup', e=>{
            this.#dragStartPoint = false;
            this.#dragEndPoint = false;
        });
        this.#containerElem.addEventListener('pointermove', e=>{
            const rect = this.#containerElem.getBoundingClientRect();
            let rX = e.clientX - rect.left;
            let rY = e.clientY - rect.top;
            if (this.#dragStartPoint){
                this.#x1 = rX / this.#containerElem.offsetWidth * 100;
                this.#y1 = rY / this.#containerElem.offsetHeight * 100;
                this.setLine(this.#x1, this.#y1, this.#x2, this.#y2);
            }
            if (this.#dragEndPoint){
                this.#x2 = rX / this.#containerElem.offsetWidth * 100;
                this.#y2 = rY / this.#containerElem.offsetHeight * 100;
                this.setLine(this.#x1, this.#y1, this.#x2, this.#y2);                
            }
        });
    }
    #quadraticEasing( value ) {
        return Math.floor(value * Math.pow(value/255, 2));
    }

    update(){
        this.setLine(this.#x1, this.#y1, this.#x2, this.#y2);
    }

    setLine(x1, y1, x2, y2){
        this.#x1 = x1;
        this.#y1 = y1;
        this.#x2 = x2;
        this.#y2 = y2;
        let px1 = this.#x1 * 0.01 * this.#canvas.offsetWidth;
        let py1 = this.#y1 * 0.01 * this.#canvas.offsetHeight;
        let px2 = this.#x2 * 0.01 * this.#canvas.offsetWidth;
        let py2 = this.#y2 * 0.01 * this.#canvas.offsetHeight;

        let pdx = Math.abs(px2 - px1);
        let pdy = py2 - py1;
        let angle = Math.atan2(pdy, pdx);
        let xo = Math.cos(angle) * this.#options.hs;
        let yo = Math.sin(angle) * this.#options.hs;
        this.#lineElem.style.left = (px1-xo)+'px';
        this.#lineElem.style.top = (py1-yo)+'px';
        this.#lineElem.style.width = Math.hypot(pdx, pdy) + this.#options.size + 'px';
        this.#lineElem.style.transform = 'rotate(' + angle + 'rad)';

        let xStep = pdx / (this.#options.points - 1);
        let yStep = pdy / (this.#options.points - 1);
        
        let canvasXScale = this.#canvas.width / this.#canvas.offsetWidth;
        let canvasYScale = this.#canvas.height / this.#canvas.offsetHeight;
        for (let i = 0; i < this.#samplePoints.length; i++){
            let samplePoint = this.#samplePoints[i];
            let cx = canvasXScale * (px1 + (xStep * i));
            let cy = canvasYScale * (py1 + (yStep * i));
            samplePoint.setXY(cx, cy);
        }
    }
    sample(data, dmxDevice){
        this.#samplePoints.forEach(samplePoint =>{
            let index = (samplePoint.y * this.#canvas.width * 4) + (samplePoint.x * 4);
            if (this.#options.ledMode){
                samplePoint.writeSample(dmxDevice, this.#quadraticEasing(data[index]), this.#quadraticEasing(data[index + 1]), this.#quadraticEasing(data[index + 2]));
            } else {
                samplePoint.writeSample(dmxDevice, data[index], data[index + 1], data[index + 2]);
            }
        })
        //writeSample
    }
}

