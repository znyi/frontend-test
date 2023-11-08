import React, { useState, useEffect, useRef } from "react";
import LineBreakTransformer from "../LineBreakTransformer";
import chunkArray from "../ChunkArray";
import Graph from "./Graph";

const BACK_END_BASE_URL = 'http://localhost:5000'

const defaultBaudRate = 115200
const defaultBufferSize = 255
const defaultDataBits = 8
const defaultParity = 'none'
const defaultStopBits = 1
const defaultFlowControl = 'none'

function App() {
  
  //port 
  const [port, setPort] = useState(null)

  const [isReading, setIsReading] = useState(false)
  const readableStreamClosed = useRef(null)
  const reader = useRef(null)

  const isSinePdoExec = useRef(false)

  //input output 
  const [aInput, setAInput] = useState('')
  const [bInput, setBInput] = useState('')
  const [cInput, setCInput] = useState('')

  const [aOutput, setAOutput] = useState('')
  const [bOutput, setBOutput] = useState('')
  const [cOutput, setCOutput] = useState('')

  const [tCoords, setTCoords] = useState([])
  const [yCoords, setYCoords] = useState([])
  const [graphTitle, setGraphTitle] = useState(`A sin (Bt + C)`)

  //port
  async function handleConnection(){
      if (port === null) {
          try {
              setPort(await navigator.serial.requestPort())
          } catch (err) {
              console.log(`error in requestPort: no port is chosen.\n\nerror message:\n${err}`)
          }
      } else {
          try {
              await port.close()
              setPort(null)
              setAInput('')
              setBInput('')
              setCInput('')
              setAOutput('')
              setBOutput('')
              setCOutput('')
              setTCoords([])
              setYCoords([])
              setGraphTitle(`A sin (Bt + C)`)
              alert(`disconnected \n
                   vendor id: ${port.getInfo().usbVendorId} \n
                   product id:  ${port.getInfo().usbProductId}`)
          } catch (err) {
              console.log(`error in handleConnection: ${err}`)
          }
      }
  }
  async function handleReadPort(){
    setIsReading(true)
    var lineBreakTransformStream = new TransformStream(new LineBreakTransformer());
    readableStreamClosed.current = port.readable.pipeTo(lineBreakTransformStream.writable);
    reader.current = lineBreakTransformStream.readable.getReader()
    try {
      const { value, done } = await reader.current.read()
      setIsReading(false)
      reader.current.cancel();
      await readableStreamClosed.current.catch(() => { /* Ignore the error */ }); 
      return value
    } catch (err){
        console.log(`error in handleReadPort: ${err}`)
    }
  }
  
  //input output
  function handleChangeInput({target}){
    if (target.name === 'aInput') {
      setAInput(target.value)
    } else if (target.name === 'bInput') {
      setBInput(target.value)
    } else if (target.name === 'cInput') {
      setCInput(target.value)
    } 
  }

  async function handleApplySine(){
    setTCoords([])
    setYCoords([])

    //step1
    const query = `/sine/step1`
    var variables = {
      variables: {
        a: parseInt(aInput)
      }
    }
    var options = {
      method:'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body:JSON.stringify(variables)
    }
    var buffer = []
    try{
      const response = await fetch(BACK_END_BASE_URL+query, options)
      const responseJSON = await response.json()
      variables = responseJSON.variables
      await handleWritePort(responseJSON.buffer)
      const readval = await handleReadPort()
      buffer =  Array.from(readval)
    } catch (err) {
      console.log(err)
    }
    
    //step2
    const query2 = `/sine/step2`
    
    variables = {
      variables: {
        ...variables,
        b: parseInt(bInput)
      },
      buffer: buffer
    }
    options = {
      method:'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(variables)
    }
    try {
      const response2 = await fetch(BACK_END_BASE_URL+query2, options)
      var responseJSON2 = await response2.json()
      variables = responseJSON2.variables
      await handleWritePort(responseJSON2.buffer)
      const readval2 = await handleReadPort()
      buffer =  Array.from(readval2)
    } catch (err) {
      console.log(err)
    }
    
    //step3
    const query3 = `/sine/step3`
    variables = {
      variables: {
        ...variables,
        c: parseInt(cInput)
      },
      buffer: buffer
    }
    options = {
      method:'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(variables)
    }
    try{
      const response3 = await fetch(BACK_END_BASE_URL+query3, options)
      var responseJSON3 = await response3.json()
      variables = responseJSON3.variables
      await handleWritePort(responseJSON3.buffer)
      const readval3 = await handleReadPort()
      buffer =  Array.from(readval3)
    } catch (err) {
      console.log(err)
    }
    
    //step4
    const query4 = `/sine/step4`
    variables = {
      variables: {
        ...variables
      },
      buffer: buffer
    }
    options = {
      method:'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(variables)
    }
    try{
      const response4 = await fetch(BACK_END_BASE_URL+query4, options)
      var responseJSON4 = await response4.json()
      variables = responseJSON4.variables
      await handleWritePort(responseJSON4.buffer)
      const firstReply = await handleReadPort() //the very first reply, [2,49,4,2,1,0,0,2,3,0,1,1,2,4,0,0,2,1,0,0] (but i am not using this, so i throw this away) 
      isSinePdoExec.current = true
      var val4array = []
      const readPdo = async ()=>{
        setIsReading(true)
        var lineBreakTransformStream = new TransformStream(new LineBreakTransformer());
        readableStreamClosed.current = port.readable.pipeTo(lineBreakTransformStream.writable);
        reader.current = lineBreakTransformStream.readable.getReader()
        try {
          while (isSinePdoExec.current) {
            const { value, done } = await reader.current.read()
            if(value){
              val4array.push(Array.from(value)) //from uint8array, convert to array 
            }
          }
        } catch (err){
            console.log(`error when read port (pdo): ${err}`)
        }
      }
      await readPdo()

      //update ui output 
      setAOutput(variables.aPrime)
      setBOutput(variables.bPrime)
      setCOutput(variables.cPrime)
console.log('total lines', val4array.length)      
      //chunk pdo serial output
      var val4arrchunks = chunkArray(val4array, 2000)
      val4array = null //dereference 
console.log('total chunks', val4arrchunks.length)
      
      //wait for every chunks to be processed
      const responsePromises = val4arrchunks.map((chunk)=>{
        const body = {
          variables: variables,
          chunk: chunk
        }
        const config = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        }
        const query = `/sine/output`
        const resjson = fetch(BACK_END_BASE_URL+query, config)
        .then((response)=>response.json())
        return resjson
      })
      val4arrchunks = null //dereference 
      var responses = await Promise.all(responsePromises)

      //flatten the 2d array into 1d
      var flat_responses = responses.flat()
      responses = null //dereference

      //take t and y arrays to plot graph
      var ts = flat_responses.map((coord)=>coord.t_rad)
      var ys = flat_responses.map((coord)=>coord.y)
      flat_responses = null //dereference

      setTCoords(ts)
      setYCoords(ys)
      setGraphTitle(`${aInput} sin (${bInput}t + ${cInput})`)

    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
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
          reader.current.cancel();
          await readableStreamClosed.current.catch(() => { /* Ignore the error */ }); 
      }
  }

  async function handleWritePort(bufferToWrite){
    const writer = port.writable.getWriter()
    try {
        var mybuf = new Uint8Array(bufferToWrite)
        await writer.write(mybuf)
    } catch (err) {
        console.log(`error in handleWritePort: ${err}`)
    } finally {
        writer.releaseLock();
    }
}

  async function handleStopSine(){
    const query = `/sine/stop`
    const response = await fetch(BACK_END_BASE_URL+query)
    const bufferToWrite = await response.json()
    await handleWritePort(bufferToWrite)
    isSinePdoExec.current =false
    await handleStopReadingPort()
  }

  return (
    <div className="App">
        <div className="container">
            <div className="part">
                <h3>connect</h3>
                <div>
                  <button onClick={handleConnection} >{port!==null? 'disconnect':'connect'}</button>
                  <button disabled={port!==null? false:true}>{isReading? 'is reading':'not reading'}</button>
                </div>
            </div>
            <div className="part">
                <h3>sine test</h3>
                <div>
                  <div>
                    <label htmlFor='aInput'>A</label>
                    <input name='aInput' type='text' disabled={port!==null? false:true} placeholder={port!==null? "":"port is not connected"} value={aInput} onChange={handleChangeInput}></input>
                  </div>
                  <div>
                    <label htmlFor='bInput'>B</label>
                    <input name='bInput' type='text' disabled={port!==null? false:true} placeholder={port!==null? "":"port is not connected"} value={bInput} onChange={handleChangeInput}></input>
                  </div>
                  <div>
                    <label htmlFor='cInput'>C</label>
                    <input name='cInput' type='text' disabled={port!==null? false:true} placeholder={port!==null? "":"port is not connected"} value={cInput} onChange={handleChangeInput}></input>
                  </div>
                  <div>
                  <button onClick={handleApplySine} disabled={port!==null? (isSinePdoExec.current? true: false):true}>apply</button>
                  <button onClick={handleStopSine} disabled={port!==null? (isSinePdoExec.current? false: true):true}>stop</button>
                  </div>
                  <div>
                    <label htmlFor='aOutput'>A'</label>
                    <input name='aOutput' type='text' disabled={true} placeholder={port!==null? "":"port is not connected"} value={aOutput}></input>
                  </div>
                  <div>
                    <label htmlFor='bOutput'>B'</label>
                    <input name='bOutput' type='text' disabled={true} placeholder={port!==null? "":"port is not connected"} value={bOutput}></input>
                  </div>
                  <div>
                    <label htmlFor='cOutput'>C'</label>
                    <input name='cOutput' type='text' disabled={true} placeholder={port!==null? "":"port is not connected"} value={cOutput}></input>
                  </div>
                  <div>
                    <Graph title={graphTitle} xs={tCoords} ys={yCoords}></Graph>
                  </div>
                </div>
            </div>
        </div>
    </div>
  );
}

export default App
