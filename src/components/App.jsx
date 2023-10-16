import React, { useState, useEffect, useRef } from "react";
import DropDown from "./DropDown";

const BACK_END_BASE_URL = 'http://localhost:5000'

const baudRateOptions = [
  9600,
  14400,
  19220,
  28800,
  38400,
  57600,
  115200,
  230400,
  260800,
  921600,
  //'custom'
]
const dataBitsOptions = [
  7, 
  8
]
const parityOptions = [
  'none',
  'even',
  'odd'
]
const stopBitsOptions = [
  1, 
  2
]
const FlowControlOptions = [
  'none', 
  'hardware'
]
const defaultBaudRate = 9600
const defaultBufferSize = 255
const defaultDataBits = 8
const defaultParity = 'none'
const defaultStopBits = 1
const defaultFlowControl = 'none'

function App() {
  const [startRange, setStartRange] = useState(0)
  const handleChangeStartRange = ({target}) => {
    setStartRange(parseInt(target.value || 0))
  }
  
  const [endRange, setEndRange] = useState(0)
  const handleChangeEndRange = ({target}) => {
    setEndRange(parseInt(target.value || 0))
  }

  const [primeList, setPrimeList] = useState([])
  const handleClick = () => {
    const query = `/primes?startRange=${startRange}&endRange=${endRange}`
    fetch(BACK_END_BASE_URL+query)
    .then(res => res.json())
    .then(primes => {
      setPrimeList(primes)
      setWriteBufferContent(JSON.stringify(primes))
    })
  }

  const [port, setPort] = useState(null)

  const [baudRate, setBaudRate] = useState(defaultBaudRate)
  const [bufferSize, setBufferSize] = useState(defaultBufferSize)
  const [dataBits, setDataBits] = useState(defaultDataBits)
  const [parity, setParity] = useState(defaultParity)
  const [stopBits, setStopBits] = useState(defaultStopBits)
  const [flowControl, setFlowControl] = useState(defaultFlowControl)

  const [writeBufferContent, setWriteBufferContent] = useState('')
  const [readDataContent, setReadDataContent] = useState('')

  const [isReading, setIsReading] = useState(false)
  const readableStreamClosed = useRef(null)
  const reader = useRef(null)


  async function handleConnection(){
      if (port === null) {
          try {
              setPort(await navigator.serial.requestPort())
          } catch (err) {
              console.log(`error in requestPort: no port is chosen.\n\nerror message:\n${err}`)
          }
      } else {
          setWriteBufferContent('')
          //stop reading port
          setIsReading(false)
          setReadDataContent('')
          reader.current.cancel();
          await readableStreamClosed.current.catch(() => { /* Ignore the error */ }); 
          try {
              await port.close()
              setPort(null)
              alert(`disconnected \n
                   vendor id: ${port.getInfo().usbVendorId} \n
                   product id:  ${port.getInfo().usbProductId}`)
          } catch (err) {
              console.log(`error in handleConnection: ${err}`)
          }
      }
  }

  useEffect(() => {
      async function tryOpenPort(){
          if (port !== null) {
              try{
                  const portOpenOption = {
                      baudRate: baudRate,
                      dataBits: dataBits,
                      stopBits: stopBits,
                      bufferSize: bufferSize,
                      parity: parity,
                      flowControl: flowControl,
                  };
                  await port.open(portOpenOption);
                  alert(`connected \n
                      vendor id: ${port.getInfo().usbVendorId} \n
                      product id:  ${port.getInfo().usbProductId}`);
                  //read
                  setIsReading(true)
                  var textDecoder = new TextDecoderStream();
                  readableStreamClosed.current = port.readable.pipeTo(textDecoder.writable);
                  reader.current = textDecoder.readable.getReader()
                  try {
                      while (true) {
                          const { value, done } = await reader.current.read()
                          if (done) {
                            // |reader| has been canceled.
                            reader.current.releaseLock()
                            break
                          }
                          setReadDataContent(value)
                      }
                  } catch (err){
                      console.log(`error in handleReadPort: ${err}`)
                  }
              } catch (err) {
                  console.log(err)
                  alert(`Failed to open serial port.\nThe port might be already open, or there might be something wrong with the device.`)
                  setPort(null)
              }
          }
      }
      tryOpenPort()
  }, [baudRate, bufferSize, dataBits, flowControl, parity, port, stopBits])

  function handleChangeOption({target}){
      if (target.name === 'baudRate') {
          setBaudRate(target.value);
      } else if (target.name === 'dataBits'){
          setDataBits(target.value)
      } else if (target.name === 'parity'){
          setParity(target.value)
      } else if (target.name === 'stopBits'){
          setStopBits(target.value)
      } else if (target.name === 'flowControl'){
          setFlowControl(target.value)
      } else if (target.name === 'bufferSize'){
          setBufferSize(target.value)
      }
  }

  async function handleWritePort(){
    const writer = port.writable.getWriter()
    const encoder = new TextEncoder()
    try {
        await writer.write(encoder.encode(writeBufferContent))
    } catch (err) {
        console.log(`error in handleChangeWriteBufferContent: ${err}`)
    } finally {
        writer.releaseLock();
        setWriteBufferContent("")
    }
}


  return (
    <div className="App">
        <div className="container">
          <div className="part">
          <h3>Find Prime Numbers</h3>
          <div>
            <label htmlFor='startRange'>startRange</label>
            <input name='startRange' type='text' inputMode='numeric' placeholder='' value={startRange} onChange={handleChangeStartRange}></input>
          </div>
          <div>
            <label htmlFor='endRange'>endRange</label>
            <input name='endRange' type='text' inputMode='numeric' placeholder='' value={endRange} onChange={handleChangeEndRange}></input>
          </div>
          <div>
            <button onClick={handleClick}>get primes</button>
          </div>
          <p>{`prime number within range [${startRange}, ${endRange}] is ...`}</p>
          <ul>
            {primeList.length !== 0 ? primeList.map((elem, index) => {
              return (
                <li key={index}>{elem}</li>
              )
            }) : <li></li>}
          </ul>
        </div>

        <div className="part">
          <h3>Connect to Port</h3>
          <div className='portConnectionGroup'>
          <button onClick={handleConnection} >{port!==null? 'disconnect':'connect'}</button>
            <DropDown name="baudRate" value={baudRate} items={baudRateOptions} onChange={handleChangeOption} isDisabled={port!==null? true:false}/>
            <DropDown name="dataBits" value={dataBits} items={dataBitsOptions} onChange={handleChangeOption} isDisabled={port!==null? true:false}/>
            <DropDown name="parity" value={parity} items={parityOptions} onChange={handleChangeOption} isDisabled={port!==null? true:false}/>
            <DropDown name="stopBits" value={stopBits} items={stopBitsOptions} onChange={handleChangeOption} isDisabled={port!==null? true:false}/>
            <DropDown name="flowControl" value={flowControl} items={FlowControlOptions} onChange={handleChangeOption} isDisabled={port!==null? true:false}/>
            <div className="portOpenOptionField">
                <label htmlFor="bufferSize">bufferSize</label>
                <input type="text" name="bufferSize" value={bufferSize} onChange={handleChangeOption} disabled={port!==null? true:false}/>
            </div>
          </div>
        </div>

        <div className="part">
          <h3>Write to Port</h3>
          <p>write to serial port as follows?</p>
          <textarea type="text" value={writeBufferContent} disabled={true} placeholder={port!==null? "":"port is not connected"}></textarea> 
          <div>
              <button onClick={handleWritePort} disabled={port!==null? false:true}>write</button>
          </div>
        </div>

        <div className="part">
          <h3>Read from Port</h3>
          <p>the data read from serial port is...</p>
          <textarea value={readDataContent} disabled={true} placeholder={port!==null? (isReading? readDataContent:''):"port is not connected"}></textarea> 
        </div>
        </div>
    </div>
  );
}

export default App;
