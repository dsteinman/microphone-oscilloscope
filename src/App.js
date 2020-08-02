import React, {useState, useEffect} from 'react';
import Microphone from './Microphone';
import Vectorscope from './Vectorscope';

function getAudioContext() {
  let audioContext;
  if (window.AudioContext) {
    audioContext = new window.AudioContext();
  }
  else if (window.webkitAudioContext) {
    console.log('creating webkitAudioContext');
    audioContext = new window.webkitAudioContext();
  }
  else {
    throw new Error('no AudioContext');
  }
  return audioContext;
}

async function getMicrophones() {
  const deviceInfos = await navigator.mediaDevices.enumerateDevices();
  const mics = [];
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    if (deviceInfo.kind === 'audioinput') {
      let id = deviceInfo.deviceId;
      let name = deviceInfo.label || 'microphone '+i;
      // if (i === 0 && name.toLowerCase().indexOf('default')>-1) continue;
      mics.push({
        id,
        name
      });
    }
  }
  return mics;
}

const microphones = [];

function startVisualization(canvas) {
  let channels = [
      [],
      []
  ];
  
  let audioContext = getAudioContext();
  
  let vectorscope = new Vectorscope(audioContext);
  
  const processData = function() {
    if (channels[0].length && channels[1].length) {
      if (channels[0].length == channels[1].length) {
        let left = channels[0].shift();
        let right = channels[1].shift();
        // console.log('combined', left.length, right.length);
  
        if (canvas) {
          vectorscope.processChannels(left, right, canvas);
        }
        else {
          console.log('no caanvas');
        }
        
      }
      else {
        console.log('oops', channels[0].length, channels[0].length);
      }
    }
    else {
      if (channels[0].length && channels[1].length === 0) {
        channels[0] = [channels[0].pop()];
      }
      else if (channels[1].length && channels[0].length === 0) {
        channels[1] = [channels[0].pop()];
      }
      else {
      
      }
    }
  }
  
  const addData = function(channel, data) {
    channels[channel].push(data);
    processData();
  }
  
  microphones[0].on('data', function(data) {
    addData(0, data);
  });
  microphones[1].on('data', function(data) {
    addData(1, data);
  });
}

function App() {
  let [mics, setMics] = useState([]);
  let [mic1, setMic1] = useState(null);
  let [mic2, setMic2] = useState(null);
  let [micsChosen, setMicsChosen] = useState(false);
  let [visualizationActive, setVisualizationActive] = useState(false);
  
  let canvasRef = React.createRef();
  
  useEffect(() => {
    if (!visualizationActive && canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      setVisualizationActive(true);
      startVisualization(canvasRef.current);
    }
    
    (async () => {
      if (mics.length === 0) {
        let mics = await getMicrophones();
        setMics(mics);
      }
    })();
    
  });
  
  
  const choose = (mic) => {
    if (!mic1) {
      setMic1(mic);
      startRecording(0, mic);
    }
    else if (!mic2) {
      setMic2(mic);
      startRecording(1, mic);
      setMicsChosen(true);
    }
  };
  
  let c;
  if (micsChosen) {
    c = (<div>
      <canvas ref={canvasRef} id="c"/>
    </div>)
  }
  else {
    c = (<ChooseMic mics={mics} onChooseMic={choose} mic1={mic1} mic2={mic2} />);
  }
  
  return (
      <div className="App">
        {c}
      </div>
  );
}

function startRecording(num, mic) {
  microphones[num] = new Microphone({
    microphone: mic.id,
    chunkSize: 512
  });
  microphones[num].start();
  return microphones[num];
}

function ChooseMic(props) {
  let n = (props.mic1)? 'Right' : 'Left'
  
  if (props.mics.length < 2) {
    let mics;
    if (props.mics.length === 1) mics = (<div>Found 1 microphone: {props.mics[0].name}</div>)
    return (<div>
      Sorry this demo requires 2 microphones.
      <br/>
      <br/>
      {mics}
    </div>)
  }
  
  return (
    <div className="choose">
      <strong>Choose {n} Microphone:</strong>
      <ul>
        {props.mics.map((m, i) => {
          const handler = (e) => {
            e.preventDefault();
            props.onChooseMic(m);
          };
          if (props.mic1 && m.id === props.mic1.id) {
            return (<li key={i} >
              LEFT: {m.name}
            </li>);
          }
          if (props.mic2 && m.id === props.mic2.id) {
            return (<li key={i} >
              RIGHT: {m.name}
            </li>);
          }
          return (<li key={i} >
                <a href="#" onClick={handler}>{m.name}</a>
          </li>);
        })}
      </ul>
    </div>
  );
}

export default App;
