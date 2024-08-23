import React, { useRef } from "react";

const NewFaceRecognition = () => {
  const videoRef = useRef();

  const handlePlay = async () => {
    
  };

  return (
    <div style={{ border: "1px solid red", height: "60vh", width: "80vw" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        height="100%"
        width="80%"
        style={{ border: "1px solid black" }}
      />
    </div>
  );
};
export default NewFaceRecognition;
