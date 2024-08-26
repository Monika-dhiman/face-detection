import React from 'react';
import './App.css';
import FaceRecognition from './components/FaceRecognition';
import NewFaceRecognition from './components/NewFaceRecognition';

function App() {
  return (
    <div className="App">
      <h1>Real-Time Face Recognition</h1>
      <FaceRecognition />
      {/* <NewFaceRecognition /> */}
    </div>
  );
}

export default App;
