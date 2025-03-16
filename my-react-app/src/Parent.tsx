import React, { useState, useRef } from "react";
import Aug from "./Aug"; // Adjust the import path

const ParentComponent = () => {
  const [isARSelected, setIsARSelected] = useState(false);
  const [isARSupported, setIsARSupported] = useState(null); // null = unknown, true = supported, false = unsupported
  const arButtonRef = useRef(null); // Ref to trigger ARButton click

  
  const checkARSupport = async () => {
    if (!navigator.xr) {
      setIsARSupported(false);
      return;
    }

    try {
      const isSupported = await navigator.xr.isSessionSupported("immersive-ar");
      setIsARSupported(isSupported);
    } catch (error) {
      console.error("Error checking AR support:", error);
      setIsARSupported(false);
    }
  };

  // Handle button click to start AR
  
  const handleARButtonClick = async () => {
    if (isARSupported === null) {
      await checkARSupport();
    }

    if (isARSupported) {
      setIsARSelected(true);
      setTimeout(() => {
        if (arButtonRef.current) {
          arButtonRef.current.click();
        }
      }, 100); // Small delay to ensure DOM updates
    }
  };
 
  // Handle exiting AR
  const handleExitAR = () => {
    setIsARSelected(false); // This will unmount ARScene and trigger cleanup
  };

  return (
    <div className="">
      {!isARSelected ? (
        <>
          <button
            onClick={handleARButtonClick}
            className={`w-1/2 py-3 flex flex-row border-2 justify-center items-center gap-3 bg-white text-black`}
          >
            <div className="relative w-10 h-10 flex items-center justify-center cursor-pointer">
              {/* Add your icon here if needed */}
            </div>
            <div>{isARSupported===true ? 'Check AR' : 'Check Ar compatible'}</div>
          </button>

          {isARSupported === false && (
            <div className="mt-4 text-red-500">Sorry, your device does not support AR.</div>
          )}
          {isARSupported === true && !isARSelected && (
            <div className="mt-4 text-green-500">Your device supports AR!</div>
          )}
        </>
      ) : (
        isARSupported && <Aug arButtonRef={arButtonRef} onExit={handleExitAR} />
      )}
    </div>
  );
};

export default ParentComponent;