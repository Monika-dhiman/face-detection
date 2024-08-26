import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const FaceRecognition = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [videoDevice, setvideoDevice] = useState([]);
  const [ditection, setDetection] = useState([]);

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
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      startVideo();
    };

    loadModels();

    const handlePlay = async () => {
      const canvas = faceapi.createCanvasFromMedia(videoRef.current);
      canvasRef.current = canvas;
      
      // Appending the canvas to a specific container
      const container = document.getElementById("video-container");
      container.append(canvas);

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
        setDetection(detections);

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );
        const results = resizedDetections.map((d) =>
          faceMatcher.findBestMatch(d.descriptor)
        );

        // Clear previous drawings
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

        // Draw new detections
        results.forEach((result, i) => {
          const box = resizedDetections[i].detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, {
            label: result.toString(),
          });
          drawBox.draw(canvas);
        });
      }, 100);
      console.log("🚀 ~ handlePlay ~ detections", ditection);
    };

    videoRef.current?.addEventListener("play", handlePlay);

    return () => {
      videoRef.current?.removeEventListener("play", handlePlay);
    };
  }, []);

  const loadLabeledImages = () => {
    const labels = ["person-1", "person-2"]; // Add more labels as needed
    return Promise.all(
      labels.map(async (label) => {
        const descriptions = [];
        for (let i = 1; i <= 5; i++) { // Looping through 5 images for each label
          const imageUrl = `${window.location.origin}/labeled_images/${label}/${i}.jpg`;
          try {
            const img = await faceapi.fetchImage(imageUrl);
            const detections = await faceapi
              .detectSingleFace(img)
              .withFaceLandmarks()
              .withFaceDescriptor();
            if (detections) {
              descriptions.push(detections.descriptor);
            } else {
              console.warn(`No face detected in image: ${imageUrl}`);
            }
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

  return (<>
    <h1>New Face Recognition</h1>
    <div id="video-container" style={{ position: "relative", width: "720px", height: "560px" }}>
      {videoDevice.length === 0 ? (
        <p>No camera found on this device.</p>
      ) : (
        <>
          <video
            ref={videoRef}
            width="720"
            height="560"
            autoPlay
            muted
            style={{ border: "2px solid red" }}
          />
        </>
      )}
    </div>
    </>
  );
};

export default FaceRecognition;
