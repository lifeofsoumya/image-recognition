"use client"

// Import necessary libraries
import { useEffect, useRef } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const Page = () => {
  // Create references for video and canvas elements
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  function runDetection(){
    // just check that getUsermedia returns a promise or not
    const isPromise = navigator.mediaDevices.getUserMedia({ video: true }) instanceof Promise; 

    // Check if the browser supports getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const webCamPromise = navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: { facingMode: "user" } // Use front camera
        })
        .then((stream) => {
          // Set the video source to the webcam stream
          videoRef.current.srcObject = stream;
          return new Promise((resolve) => {
            videoRef.current.onloadedmetadata = () => { // waits for onloadedmetadata event, holds like dimensions
              resolve(); // Resolve when ensures we can use video elem
            };
          });
        });

      // Load the COCO-SSD model
      const modelPromise = cocoSsd.load();

      Promise.all([modelPromise, webCamPromise]) // we need both promises to resolve
        .then((values) => {
          detectFrame(videoRef.current, values[0]); // values = array of 2 resolved value from 2 promises
        })
        .catch((error) => {
          console.error(error); // Log any errors
        });
    }
  }

  // This effect runs once when the component mounts
  useEffect(() => {
    runDetection()
  }, []); // Empty dependency array means this runs once on mount

  // Function to detect objects in each frame
  const detectFrame = (video, model) => { // it's continiuosly being called 
    // console.log('inside detect frame')

    model.detect(video).then((predictions) => {
      renderPredictions(predictions); // Once predictions are obtained
      //method, create smooth animations by telling the browser to call a specific function before the next repaint
      requestAnimationFrame(() => {
        detectFrame(video, model); // recursion
      });
      // helps reduce CPU load by pausing animations in inactive tabs (show with console log)
    });
  };

  // Function to render predictions on the canvas
  const renderPredictions = (predictions) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear previous drawings

    const font = "16px sans-serif"; // Set font style
    ctx.font = font;
    ctx.textBaseline = "top";

    predictions.forEach((prediction) => {
      // console.log(prediction.class, ' predicted value'); 
      const [x, y, width, height] = prediction.bbox; // Destructure bounding box coordinates

      ctx.strokeStyle = "#00FFFF"; // Set bounding box color
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height); // Draw bounding box

      ctx.fillStyle = "#00FFFF"; // Set background color for label
      const textWidth = ctx.measureText(prediction.class).width;
      ctx.fillRect(x, y, textWidth + 4, parseInt(font, 10) + 4); // Draw label background

      ctx.fillStyle = "#000000"; // Set text color for label
      ctx.fillText(prediction.class, x, y); // Draw label text
    });
  };

  return (
    <div className="relative h-screen bg-indigo-300 rounded-lg flex items-center justify-center">
      <video
        className="border-8 border-dashed absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl"
        autoPlay
        playsInline
        muted
        ref={videoRef}
        width="600"
        height="500"
      />
      <canvas
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl"
        ref={canvasRef}
        width="600"
        height="500"
      />
  </div>
  
  );
};

export default Page;