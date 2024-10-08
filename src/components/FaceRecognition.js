import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const FaceRecognition = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const verificationThreshold = 0.6;
  const [verificationResult, setVerificationResult] = useState(null);
  const [videoDevice, setvideoDevice] = useState([]);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const checkCameraAvailability = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setvideoDevice(videoDevices);

        if (videoDevices.length === 0) {
          console.error("No camera found on this device.");
          return false;
        }
        return true;
      } catch (error) {
        console.error("Error enumerating devices: ", error);
        return false;
      }
    };

    const startVideo = async () => {
      try {
        const cameraAvailable = await checkCameraAvailability();
        if (!cameraAvailable) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error("Error accessing camera: ", error);
      }
    };

    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL); // Ensure SSD Mobilenet is loaded
      startVideo();
    };

    loadModels();

    const handlePlay = async () => {
      const canvas = faceapi.createCanvasFromMedia(videoRef.current);
      canvasRef.current = canvas;
      document.body.append(canvas);

      const displaySize = {
        width: videoRef.current.width,
        height: videoRef.current.height,
      };
      faceapi.matchDimensions(canvas, displaySize);
      const labeledFaceDescriptors = await loadLabeledImages();
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        // Check for verification based on the first detected face
        if (resizedDetections.length > 0) {
          const firstFaceDescriptor = resizedDetections[0].descriptor;
          const result = faceMatcher.findBestMatch(firstFaceDescriptor);
          const isVerified = result.distance < verificationThreshold;
          setLabel(result.label); // Update label state
          setVerificationResult(isVerified); // Update verification result state
          console.log(`Face 1 - Verified: ${isVerified}`);

          // Update UI to display "Verified" or "Not Verified" based on isVerified
        } else {
          setVerificationResult(null); // Clear verification result if no face is detected
        }

        // Clear the canvas
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

        // Draw bounding boxes and labels for each detection
        resizedDetections.forEach((d, i) => {
          const box = d.detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, {
            label: label || "Face",
          });
          drawBox.draw(canvas);
        });

      }, 100);
    };

    videoRef.current?.addEventListener("play", handlePlay);

    return () => {
      videoRef.current?.removeEventListener("play", handlePlay);
    };
  }, []);
  
  const loadLabeledImages = () => {
    const labels = ["person-1", "person-2"]; // Replace with actual names
    return Promise.all(
      labels.map(async (label) => {
        const descriptions = [];
        for (let i = 1; i < 2; i++) {
          const imageUrl = `${window.location.origin}/labeled_images/${label}/${i}.jpg`;
          console.log("imageUrl: ", imageUrl);
          try {
            console.log(`Fetching image from URL: ${imageUrl}`);
            const img = await faceapi.fetchImage(imageUrl);
            const detections = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();
            descriptions.push(detections.descriptor);
          } catch (error) {
            console.error(
              `Error fetching or processing image at ${imageUrl}: `,
              error
            );
          }
        }
        return new faceapi.LabeledFaceDescriptors(label, descriptions);
      })
    );
  };
  console.log("new changes in face recognition");
  return (
    // <div>
    //   <video ref={videoRef} width="720" height="560" autoPlay muted />
    //   <canvas ref={canvasRef} />
    // </div>
    // <div id="video-container" style={{ position: "relative", width: "720px", height: "560px" }}>
    //   {videoDevice.length === 0 ? (
    //     <p>No camera found on this device.</p>
    //   ) : (
    <>
    <div style={{ border: "1px solid red" }}>
      <video ref={videoRef} width="720" height="560" autoPlay muted />
      <canvas ref={canvasRef} />
    </div>
    {verificationResult !== null && (
      <p>{verificationResult ? 'Verified' : 'Not Verified'}</p>
    )}
    </>
    //   )}
    // </div>
  );
};

export default FaceRecognition;
