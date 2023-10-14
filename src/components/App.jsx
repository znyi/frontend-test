import React, { useState } from "react";

const BACK_END_BASE_URL = 'http://localhost:5000'

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
    .then(primes => setPrimeList(primes))

  }

  return (
    <div>
        <div>
          <label htmlFor='startRange'>startRange</label>
          <input name='startRange' type='text' inputMode='numeric' placeholder='' value={startRange} onChange={handleChangeStartRange}></input>
          <br/>

          <label htmlFor='endRange'>endRange</label>
          <input name='endRange' type='text' inputMode='numeric' placeholder='' value={endRange} onChange={handleChangeEndRange}></input>
          <br />

          <button onClick={handleClick}>get primes</button>
          <br />
        </div>

        <div>
          <p>{`prime number within range [${startRange}, ${endRange}] is ...`}</p>
          <ul>
            {primeList.length !== 0 ? primeList.map((elem, index) => {
              return (
                <li key={index}>{elem}</li>
              )
            }) : <li></li>}
          </ul>
        </div>

        <div>
          
        </div>

        
    </div>
  );
}

export default App;
