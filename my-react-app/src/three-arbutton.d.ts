declare module 'three/examples/jsm/webxr/ARButton' {
    export class ARButton {
      static createButton(renderer: any, options?: any): HTMLElement;
    }
  }
  


//   declare module 'three/examples/jsm/loaders/GLTFLoader' {
//     import { LoadingManager, Group } from 'three';
  
//     export class GLTFLoader {
//       constructor(manager?: LoadingManager);
      
//       load(
//         url: string,
//         onLoad: (gltf: GLTF) => void,
//         onProgress?: (event: ProgressEvent) => void,
//         onError?: (event: ErrorEvent) => void
//       ): void;
      
//       parse(
//         data: ArrayBuffer | string,
//         path: string,
//         onLoad: (gltf: GLTF) => void,
//         onError?: (event: ErrorEvent) => void
//       ): void;
      
//       setPath(path: string): GLTFLoader;
//     }
  
//     export interface GLTF {
//       scene: Group;
//       scenes: Group[];
//       animations: any[];
//       cameras: any[];
//       asset: any;
//     }
//   }
  