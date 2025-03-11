import { FileLoader, Loader, LoadingManager } from './three.module.js';

/**
 * A simple stub for the GLTFLoader
 */
export class GLTFLoader extends Loader {
  constructor(manager) {
    super(manager);
  }

  load(url, onLoad, onProgress, onError) {
    const loader = new FileLoader(this.manager);
    loader.setPath(this.path);
    loader.setResponseType('json');
    
    // Create a minimal stub that simulates a GLTF loaded model
    const mockData = {
      scene: {
        clone: function() {
          return {
            traverse: function(callback) {},
            getObjectByName: function(name) { return null; }
          };
        }
      }
    };
    
    // Simulate successful loading
    if (onLoad) setTimeout(() => onLoad(mockData), 100);
    
    return mockData;
  }

  setPath(value) {
    this.path = value;
    return this;
  }
}