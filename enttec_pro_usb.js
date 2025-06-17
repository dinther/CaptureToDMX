//  specs: https://cdn.enttec.com/pdf/assets/70304/70304_DMX_USB_PRO_API.pdf

const ENTTEC_MESSAGE_START = 0x7E;
const ENTTEC_MESSAGE_END = 0xE7;
const DATA_OFFSET = 5;
const ENTTEC_GET_WIDGET_PARAMS = 3;
const ENTTEC_SET_WIDGET_PARAMS = 4;
const ENTTEC_RX_DMX_PACKET = 5;
const ENTTEC_TX_DMX_PACKET = 6;

export class EnttecPro {
  #options = {auto: false, channels: 512, baudRate: 250000};
  dmxData;
  constructor(serialPort, options) {
    this.serialport = serialPort;
    Object.assign(this.#options, options);
    this.init();
  }

  async init(){
    this.dmxData = new Uint8Array(this.#options.channels + DATA_OFFSET + 1).fill(0);
    this.dmxData[0] = ENTTEC_MESSAGE_START;
    this.dmxData[1] = ENTTEC_TX_DMX_PACKET;
    this.dmxData[2] = (this.#options.channels + 1) & 0xff;
    this.dmxData[3] = (this.#options.channels + 1) >>8 & 0xff
    this.dmxData[4] = 0;
    this.dmxData[this.#options.channels + DATA_OFFSET] = ENTTEC_MESSAGE_END;
    if (this.serialport != null){
      await this.serialport.open({baudRate: this.#options.baudRate})
      this.writer = this.serialport.writable.getWriter();
      await this.send();
    }
  }

  async close(){
    this.dmxData.fill(0, 5, -1);
    await this.send();
    this.writer.releaseLock();
    await this.serialport.close();
  }

  async setDMX(channel, value){
    let changed = false;
    let index = DATA_OFFSET + channel - 1;
    if (Array.isArray(value)){
      for(let i=0; i<value.length; i++){
        if (this.dmxData[index+ i] != value[i]){
          changed = true;
          this.dmxData[index + i] = value[i];
        }
      };
    } else {
      if (value != this.dmxData[index]){
        changed = true;
        this.dmxData[index] = value;
      }
    }
    if ( changed ) {
        if (this.#options.auto){
          this.send().then(()=>{ return true}).catch(()=> {return false; })
        }
    }
  }

  getDMX(channel){
    return this.dmxData[DATA_OFFSET + channel - 1];
  }

  async send(){
    if (this.writer){
      await this.writer.write(this.dmxData);
    }
  }

  get options(){
    return this.#options;
  }

}
