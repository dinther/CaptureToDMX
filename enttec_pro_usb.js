
const DATA_OFFSET = 4;

export class EnttecPro {
  #options = {auto: false, channels: 512, baudRate: 250000};
  constructor(serialPort, options) {
    this.serialport = serialPort;
    Object.assign(this.#options, options);
    this.init();
  }

  async init(){
    this.dmxData = new Uint8Array(this.#options.channels + DATA_OFFSET + 1).fill(0);
    this.dmxData[0] = 0x7E;
    this.dmxData[1] = 6;
    this.dmxData[2] = this.#options.channels & 0xff;
    this.dmxData[3] = this.#options.channels >>8 & 0xff
    this.dmxData[this.#options.channels + DATA_OFFSET ] = 0xE7;
    //if (this.serialport.connected){
    //    await this.serialport.close();
    //}   
    await this.serialport.open({baudRate: this.#options.baudRate})
    //this.writer = this.serialport.writable.getWriter();
    //this.reader = this.serialport.readable.getReader();
    await this.send();
  }

  async close(){
    await this.serialport.close();
  }

  async setDMX(channel, value){
    let changed = false;
    if (Array.isArray(value)){
      for(let i=0; i<value.length; i++){
        if (this.dmxData[channel + DATA_OFFSET + i] != value[i]){
          changed = true;
          this.dmxData[channel + DATA_OFFSET + i] = value[i];
        }
      };
    } else {
      if (value != this.dmxData[channel + DATA_OFFSET]){
        changed = true;
        this.dmxData[channel + DATA_OFFSET] = value;
      }
    }
    if ( changed ) {
        if (this.#options.auto){
          this.send().then(()=>{ return true}).catch(()=> {return false; })
        }
    }
  }

  getDMX(channel){
    return this.dmxData[channel + DATA_OFFSET];
  }

  async send(){
    this.writer = this.serialport.writable.getWriter();
    await this.writer.write(this.dmxData);
    this.writer.releaseLock();
  }

  get options(){
    return this.#options;
  }

}