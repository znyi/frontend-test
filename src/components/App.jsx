import React, { useState, useEffect, useRef } from "react";
import LineBreakTransformer from "../LineBreakTransformer";

const BACK_END_BASE_URL = 'http://localhost:5000'

const defaultBaudRate = 115200
const defaultBufferSize = 255
const defaultDataBits = 8
const defaultParity = 'none'
const defaultStopBits = 1
const defaultFlowControl = 'none'

function App() {
    const [port, setPort] = useState(null)

    const [isReading, setIsReading] = useState(false)
    const readableStreamClosed = useRef(null)
    const reader = useRef(null)

    const [pdoOutputContent, setPdoOutputContent] = useState('')
    const pdoOutputAccumulated = useRef('')
    
    const [isPdoExec, setIsPdoExec] = useState(false)

    async function handleConnection(){
        if (port === null) {
            try {
                setPort(await navigator.serial.requestPort())
            } catch (err) {
                console.log(`error in requestPort: no port is chosen.\n\nerror message:\n${err}`)
            }
        } else {
            setSdoInput('')
            //stop reading port
            await handleStopReadingPort()
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
      async function handleReadPort(){
        setIsReading(true)
        var lineBreakTransformStream = new TransformStream(new LineBreakTransformer());
        readableStreamClosed.current = port.readable.pipeTo(lineBreakTransformStream.writable);
        reader.current = lineBreakTransformStream.readable.getReader()
        
        try {
            while (true) {
                const { value, done } = await reader.current.read()
                if (done) {
                  // |reader| has been canceled.
                  reader.current.releaseLock()
                  break
                }
                readData(value)
            }
        } catch (err){
            console.log(`error in handleReadPort: ${err}`)
        }
    }
    async function readData(value){
      console.log('i read')
      console.log(value)

      const SDO = Uint8Array.from([2, 59, 1])
      const PDO = Uint8Array.from([3, 49, 2])

      const commandEquals = (command, word)=>
      command.every((elem, index) => elem === word[index])

      if(commandEquals(SDO, value)){
        setSdoOutput(await extractSdoOutput(value))
      }
      else if(commandEquals(PDO, value)){
        const pdo_output_object = await extractPdoOutput(value)
        pdoOutputAccumulated.current += `data1 = ${pdo_output_object.data1}, data2 = ${pdo_output_object.data2}\n`
        setPdoOutputContent(pdoOutputAccumulated.current)
      }
    }
    async function extractSdoOutput(value){
      const sdo_buffer = value
      const sdo_array = Array.from(sdo_buffer)
      const sdo_output_buffer = JSON.stringify(sdo_array)
      const query = `/sdo/output?sdo_output_buffer=${sdo_output_buffer}`
      
      const response = await fetch(BACK_END_BASE_URL+query)
      const a_inc = await response.json()
      return a_inc
    }
    async function extractPdoOutput(value){
      const pdo_buffer = value
      const pdo_array = Array.from(pdo_buffer)
      const pdo_output_buffer = JSON.stringify(pdo_array)
      const query = `/pdo/output?pdo_output_buffer=${pdo_output_buffer}`
      
      const response = await fetch(BACK_END_BASE_URL+query)
      const pdo_output_object = await response.json()
      return pdo_output_object
    }
    async function tryOpenPort(){
        if (port !== null) {
          try{
            const portOpenOption = {
                baudRate: defaultBaudRate,
                dataBits: defaultDataBits,
                stopBits: defaultStopBits,
                bufferSize: defaultBufferSize,
                parity: defaultParity,
                flowControl: defaultFlowControl,
            };
            await port.open(portOpenOption);
            alert(`connected \n
                vendor id: ${port.getInfo().usbVendorId} \n
                product id:  ${port.getInfo().usbProductId}`);
            //read
            await handleReadPort()
          } catch (err) {
            console.log(err)
            alert(`Failed to open serial port.\nThe port might be already open, or there might be something wrong with the device.`)
            setPort(null)
          }
        }
      }
      tryOpenPort()
    }, [port])

    async function handleStopReadingPort(){
        if(isReading){
            setIsReading(false)
            setSdoOutput('')
            setPdoOutputContent('')
            reader.current.cancel();
            await readableStreamClosed.current.catch(() => { /* Ignore the error */ }); 
        }
    }

  const [sdoInput, setSdoInput] = useState('')
  function handleChangeSdoInput({target}){
    setSdoInput(target.value)
  }

  const [sdoOutput, setSdoOutput] = useState('')
  function handleChangeSdoOutput({target}){
    setSdoOutput(target.value)
  }

  async function handleWritePort(bufToWrite){
    const writer = port.writable.getWriter()
    try {
        var mybuf = new Uint8Array(bufToWrite)
        console.log('i write')
        console.log(mybuf)
        await writer.write(mybuf)
    } catch (err) {
        console.log(`error in handleWritePort: ${err}`)
    } finally {
        writer.releaseLock();
    }
}

async function handleSdo(){
  const a = parseInt(sdoInput)
  const query = `/sdo/command?sdo_a=${a}`
  const response = await fetch(BACK_END_BASE_URL+query)
  const bufferToWrite = await response.json()
  handleWritePort(bufferToWrite)
}

async function handlePdoExec(){
  setIsPdoExec(true)
  const query = `/pdo/command/exec`
  const response = await fetch(BACK_END_BASE_URL+query)
  const bufferToWrite = await response.json()
  handleWritePort(bufferToWrite)
}
async function handlePdoStop(){
  setIsPdoExec(false)
  const query = `/pdo/command/stop`
  const response = await fetch(BACK_END_BASE_URL+query)
  const bufferToWrite = await response.json()
  handleWritePort(bufferToWrite)
}
  
  return (
    <div className="App">
        <div className="container">
            <div className="part">
                <h3>connect and read from port</h3>
                <div>
                  <button onClick={handleConnection} >{port!==null? 'disconnect':'connect'}</button>
                </div>
            </div>
            <div className="part">
                <h3>SDO test</h3>
                <div>
                  <div>
                    <label htmlFor='sdoInput'>a</label>
                    <input name='sdoInput' type='text' disabled={port!==null? false:true} placeholder={port!==null? "input int between 0~254":"port is not connected"} value={sdoInput} onChange={handleChangeSdoInput}></input>
                    <button onClick={handleSdo} disabled={port!==null? false:true}>SDO</button>
                  </div>
                  <div>
                    <label htmlFor='sdoOutput'>a+1</label>
                    <input name='sdoOutput' type='text' disabled={true} placeholder={port!==null? "":"port is not connected"} value={sdoOutput} onChange={handleChangeSdoOutput}></input>
                  </div>
                </div>
            </div>
            <div className="part">
              <h3>PDO test</h3>
              <div>
                <button onClick={!isPdoExec? handlePdoExec:handlePdoStop} disabled={port!==null? false:true}>{!isPdoExec? 'exec':'stop'}</button>
              </div>
              <div>
                <textarea value={pdoOutputContent} disabled={true} placeholder={port!==null? (isReading? pdoOutputContent:''):"port is not connected"}></textarea>
              </div>
            </div>
        </div>
    </div>
  );
}

export default App
