import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const ARScene = ({ arButtonRef, onExit }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const reticleRef = useRef(null);
  const hitTestSourceRef = useRef(null);
  const localSpaceRef = useRef(null);
  const hitTestSourceInitializedRef = useRef(false);
  const controllerRef = useRef(null);
  const sessionRef = useRef(null);
  const exitButtonRef = useRef(null); // Ref for the exit button DOM element

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(70, container.clientWidth / window.innerHeight, 0.01, 20);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, window.innerHeight);
    renderer.xr.enabled = true;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", onSelect);
    scene.add(controller);
    controllerRef.current = controller;

    const geometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const reticle = new THREE.Mesh(geometry, material);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    reticleRef.current = reticle;

    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      onSessionStarted: (session) => {
        sessionRef.current = session;
        renderer.domElement.style.display = "block";
        if (exitButtonRef.current) {
          exitButtonRef.current.style.display = "block"; // Show exit button when session starts
        }
      },
    });
    arButtonRef.current = arButton;
    document.body.appendChild(arButton);

    // Initially hide the renderer and exit button
    renderer.domElement.style.display = "none";
    if (exitButtonRef.current) {
      exitButtonRef.current.style.display = "none";
    }

    window.addEventListener("resize", onWindowResize, false);

    renderer.setAnimationLoop(render);

    return () => {
      window.removeEventListener("resize", onWindowResize);
      if (sessionRef.current) {
        sessionRef.current.end();
        sessionRef.current = null;
      }
      renderer.setAnimationLoop(null);
      document.body.removeChild(arButton);
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [arButtonRef]);

  const onWindowResize = () => {
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const container = containerRef.current;
    if (camera && renderer && container) {
      camera.aspect = container.clientWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, window.innerHeight);
    }
  };

  const onSelect = () => {
    const reticle = reticleRef.current;
    const scene = sceneRef.current;
    const loader = new GLTFLoader();

    if (reticle?.visible) {
      loader.load(
        "/Chr.glb",
        (gltf) => {
          const chair = gltf.scene;
          chair.position.setFromMatrixPosition(reticle.matrix);
          chair.quaternion.setFromRotationMatrix(reticle.matrix);
          chair.scale.set(1, 1, 1);
          scene?.add(chair);
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        },
        (error) => {
          console.error("An error occurred while loading the model:", error);
        }
      );
    }
  };

  const initializeHitTestSource = async (session) => {
    const viewerSpace = await session.requestReferenceSpace("viewer");
    const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
    const localSpace = await session.requestReferenceSpace("local");

    hitTestSourceRef.current = hitTestSource;
    localSpaceRef.current = localSpace;
    hitTestSourceInitializedRef.current = true;

    session.addEventListener("end", () => {
      hitTestSourceInitializedRef.current = false;
      hitTestSourceRef.current = null;
      if (exitButtonRef.current) {
        exitButtonRef.current.style.display = "none"; // Hide exit button when session ends
      }
    });
  };

  const render = (timestamp, frame) => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const reticle = reticleRef.current;
    const hitTestSource = hitTestSourceRef.current;
    const localSpace = localSpaceRef.current;

    if (frame) {
      if (!hitTestSourceInitializedRef.current) {
        const session = renderer?.xr.getSession();
        initializeHitTestSource(session);
      }

      if (hitTestSourceInitializedRef.current) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const pose = hit.getPose(localSpace);
          reticle.visible = true;
          reticle.matrix.fromArray(pose.transform.matrix);
        } else {
          reticle.visible = false;
        }
      }

      if (scene && camera) {
        renderer?.render(scene, camera);
      }
    }
  };

  const handleExitClick = () => {
    if (sessionRef.current) {
      sessionRef.current.end();
    }
    onExit();
  };

  return (
    <div className="flex flex-row h-screen w-full">
      {/* Left Side - AR Content */}
      <div
        ref={containerRef}
        className="w-1/2 h-full overflow-hidden relative"
        style={{ background: "#000" }}
      >
        <button
          ref={exitButtonRef}
          onClick={handleExitClick}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 py-2 px-4 bg-red-500 text-white rounded z-10"
          style={{ display: "none" }} // Initially hidden
        >
          Exit AR
        </button>
      </div>

      {/* Right Side - Placeholder */}
      <div className="w-1/2 h-full flex items-center justify-center">
        <p className="text-gray-500">AR is displayed on the left</p>
      </div>
    </div>
  );
};

export default ARScene;