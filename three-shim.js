// This shim prevents WebGLAnimation from being redeclared
if (typeof window.WebGLAnimation === 'undefined') {
    window.WebGLAnimation = {};
}

// Export an async function to safely load Three.js
export async function loadThreeJs() {
    // Only import if not already available
    if (!window.THREE) {
        const THREE = await import('./three.module.js');
        const VRButton = await import('./VRButton.js');
        const XRControllerModelFactory = await import('./XRControllerModelFactory.js');
        
        window.THREE = THREE;
        window.VRButton = VRButton.VRButton;
        window.XRControllerModelFactory = XRControllerModelFactory.XRControllerModelFactory;
    }
    
    return {
        THREE: window.THREE,
        VRButton: window.VRButton,
        XRControllerModelFactory: window.XRControllerModelFactory
    };
}
