import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ARScene = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);  // For HTML container element
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);  // For the THREE renderer
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);  // For the THREE camera
    const sceneRef = useRef<THREE.Scene | null>(null);  // For the THREE scene
    const reticleRef = useRef<THREE.Mesh | null>(null);  // For the reticle mesh
    const hitTestSourceRef = useRef<XRHitTestSource | null>(null);  // For XR hit test source
    const localSpaceRef = useRef<XRReferenceSpace | null>(null);  // For XR reference space
    const hitTestSourceInitializedRef = useRef<boolean>(false);  // Boolean to track hit test initialization
    const controllerRef = useRef<THREE.Group | null>(null);  // For the THREE controller group

  useEffect(() => {
    // Initialization
    const container = containerRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    rendererRef.current = renderer;
    container?.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", onSelect);
    scene.add(controller);
    controllerRef.current = controller;

    // Adding the reticle (target)
    const geometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);

    // const geometry = new THREE.RingBufferGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial();
    const reticle = new THREE.Mesh(geometry, material);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    reticleRef.current = reticle;

    const arButton = ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] });
    document.body.appendChild(arButton);
    renderer.domElement.style.display = "none"; // This hides the canvas before AR starts

    window.addEventListener("resize", onWindowResize, false);

    // Start rendering
    renderer.setAnimationLoop(render);

    return () => {
      // Clean up the event listeners and DOM nodes
      window.removeEventListener("resize", onWindowResize);
      if (renderer && renderer.domElement) {
        container?.removeChild(renderer.domElement);
      }
    };
  }, []);

  const onWindowResize = () => {
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    camera!.aspect = window.innerWidth / window.innerHeight;
    camera?.updateProjectionMatrix();
    renderer?.setSize(window.innerWidth, window.innerHeight);
  };




const onSelect = () => {
    const reticle = reticleRef.current;
    const scene = sceneRef.current;
    const loader = new GLTFLoader();

    if (reticle?.visible) {
      // Load the GLTF model
      loader.load(
        '/chair.gltf', 
        (gltf) => {
          const chair = gltf.scene;

          // Set the chair's position and orientation to the reticle's matrix
          chair.position.setFromMatrixPosition(reticle.matrix);
          chair.quaternion.setFromRotationMatrix(reticle.matrix);

          // Optionally adjust the scale if the model is too big or small
          chair.scale.set(1, 1, 1);

          scene?.add(chair);
        },
        (xhr)=>{
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded')
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

          reticle!.visible = true;
          reticle?.matrix.fromArray(pose.transform.matrix);
        } else {
          reticle!.visible = false;
        }
      }

      if (scene && camera) {
        renderer?.render(scene, camera);
      }
      
    }
  };

  return <div ref={containerRef} />;
};

export default ARScene;
