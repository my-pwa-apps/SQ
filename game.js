let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let raycaster;
const intersected = [];
const tempMatrix = new THREE.Matrix4();
let isVRMode = false;
let audioContext;
let gainNodeAmbient, gainNodeMusic;

// Initialize audio context once to prevent multiple instances
function initAudio() {
    // Only create audio context on user interaction to comply with browser policies
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function createAmbientSound() {
    const ctx = initAudio();
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    gainNodeAmbient = ctx.createGain();
    gainNodeAmbient.gain.value = 0.05; // Lower volume for ambient sound

    whiteNoise.connect(gainNodeAmbient);
    gainNodeAmbient.connect(ctx.destination);
    whiteNoise.start(0);
    
    return { source: whiteNoise, gain: gainNodeAmbient };
}

function createChiptuneMusic() {
    const ctx = initAudio();
    const oscillator = ctx.createOscillator();
    gainNodeMusic = ctx.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);

    gainNodeMusic.gain.setValueAtTime(0.08, ctx.currentTime);

    oscillator.connect(gainNodeMusic);
    gainNodeMusic.connect(ctx.destination);
    oscillator.start();

    // Simple chiptune melody with better performance
    const melody = [440, 494, 523, 587, 659, 698, 784, 880];
    let index = 0;
    
    // Use requestAnimationFrame for smoother timing
    let lastTime = 0;
    let interval = 500; // ms
    
    function updateNote(time) {
        if (time - lastTime >= interval) {
            oscillator.frequency.setValueAtTime(melody[index], ctx.currentTime);
            index = (index + 1) % melody.length;
            lastTime = time;
        }
        requestAnimationFrame(updateNote);
    }
    
    requestAnimationFrame(updateNote);
    
    return { source: oscillator, gain: gainNodeMusic };
}

function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000033); // Slightly blue-black for better ambiance

    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    light.position.set(0, 1, 0);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
}

function setupCamera() {
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 3);
}

function setupRenderer() {
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance" 
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    
    // Optimize renderer
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    document.body.appendChild(renderer.domElement);
}

function setupVR() {
    const vrButton = document.getElementById('vrButton');
    
    if (vrButton) {
        vrButton.addEventListener('click', () => {
            // Use the VRButton from THREE.js
            document.body.appendChild(VRButton.createButton(renderer));
        });
    }
    
    const toggleVRButton = document.getElementById('toggleVRButton');
    
    if (toggleVRButton) {
        toggleVRButton.addEventListener('click', toggleVRMode);
    }
}

function setupControllers() {
    // Initialize controller 1
    controller1 = renderer.xr.getController(0);
    controller1.addEventListener('selectstart', onSelectStart);
    controller1.addEventListener('selectend', onSelectEnd);
    scene.add(controller1);

    // Add visible ray for controller 1
    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
    ]);
    const line = new THREE.Line(geometry);
    line.name = 'line';
    line.scale.z = 5;
    controller1.add(line);

    // Initialize controller 2
    controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);
    scene.add(controller2);

    // Add visible ray for controller 2
    const line2 = new THREE.Line(geometry);
    line2.name = 'line';
    line2.scale.z = 5;
    controller2.add(line2);

    // Controller grips
    const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);
}

function setupEventListeners() {
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('click', onMouseClick, false);
}

function init() {
    // Initialize renderer container
    const container = document.createElement('div');
    document.body.appendChild(container);

    // Initialize core components
    setupScene();
    setupCamera();
    setupRenderer();
    
    // Initialize raycaster - was missing in original code
    raycaster = new THREE.Raycaster();
    
    // Setup VR and controllers
    setupVR();
    setupControllers();
    setupEventListeners();

    // Example objects with better materials
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    
    // Keycard object
    const keycardMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00,
        metalness: 0.7,
        roughness: 0.2
    });
    const keycard = new THREE.Mesh(geometry, keycardMaterial);
    keycard.name = 'keycard';
    keycard.position.set(0, 1.5, -1);
    keycard.castShadow = true;
    scene.add(keycard);

    // NPC object
    const npcMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x0088ff,
        metalness: 0.3,
        roughness: 0.7
    });
    const npc1 = new THREE.Mesh(geometry, npcMaterial);
    npc1.name = 'npc1';
    npc1.position.set(1, 1.5, -1);
    npc1.castShadow = true;
    scene.add(npc1);

    // Start animation loop
    animate();
}

function onMouseClick(event) {
    // Ensure raycaster is initialized
    if (!raycaster) return;
    
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true); // Set true to check descendants

    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.name === 'keycard') {
            addToInventory('Keycard');
        } else if (object.name === 'npc1') {
            startDialogue('npc1');
        } else {
            handleCommand('look at');
        }
    }
}

// Text-Parser Mechanic
function handleCommand(command) {
    const dialogueElement = document.getElementById('dialogue');
    if (!dialogueElement) return;
    
    switch (command.toLowerCase()) {
        case 'look at':
            dialogueElement.innerText = "You see an interesting object.";
            break;
        case 'talk to':
            dialogueElement.innerText = "There's no one to talk to here.";
            break;
        case 'use':
            dialogueElement.innerText = "You can't use that here.";
            break;
        case 'pick up':
            dialogueElement.innerText = "You picked it up.";
            break;
        default:
            dialogueElement.innerText = `Unknown command: ${command}`;
    }
}

// Only add event listener if the element exists
const parserInput = document.getElementById('parserInput');
if (parserInput) {
    parserInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const command = event.target.value;
            handleCommand(command);
            event.target.value = '';
        }
    });
}

// Inventory System
const inventory = [];

function addToInventory(item) {
    // Check if item is already in inventory
    if (!inventory.includes(item)) {
        inventory.push(item);
        
        const inventoryElement = document.getElementById('inventory');
        if (inventoryElement) {
            inventoryElement.innerText = 'Inventory: ' + inventory.join(', ');
        }
    }
}

// Dialogue Trees
const dialogues = {
    npc1: [
        'Hello, traveler!',
        'What brings you to this part of the galaxy?',
        'Safe travels!'
    ]
};

function startDialogue(npc) {
    const dialogue = dialogues[npc];
    if (!dialogue) return;
    
    const dialogueElement = document.getElementById('dialogue');
    if (!dialogueElement) return;
    
    // Clean up old event listeners to prevent memory leaks
    const newDialogueElement = dialogueElement.cloneNode(true);
    dialogueElement.parentNode.replaceChild(newDialogueElement, dialogueElement);
    
    let dialogueIndex = 0;
    newDialogueElement.innerText = dialogue[dialogueIndex];

    newDialogueElement.addEventListener('click', advanceDialogue);
    
    function advanceDialogue() {
        dialogueIndex++;
        if (dialogueIndex < dialogue.length) {
            newDialogueElement.innerText = dialogue[dialogueIndex];
        } else {
            newDialogueElement.innerText = 'Dialogue: ';
            newDialogueElement.removeEventListener('click', advanceDialogue);
        }
    }
}

function toggleVRMode() {
    isVRMode = !isVRMode;
    if (isVRMode) {
        document.body.appendChild(VRButton.createButton(renderer));
        renderer.xr.enabled = true;
    } else {
        const vrButton = document.querySelector('.vr-button');
        if (vrButton) {
            vrButton.remove();
        }
        // Don't disable XR as it may be needed later
        // Instead, just stop the XR session if active
        if (renderer.xr.isPresenting) {
            renderer.xr.getSession().end();
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onSelectStart(event) {
    const controller = event.target;
    const intersections = getIntersections(controller);

    if (intersections.length > 0) {
        const intersection = intersections[0];
        const object = intersection.object;
        object.material.emissive.b = 1;
        controller.userData.selected = object;

        // Example interaction logic
        if (object.name === 'keycard') {
            addToInventory('Keycard');
        } else if (object.name === 'npc1') {
            startDialogue('npc1');
        } else {
            handleCommand('look at');
        }
    }
}

function onSelectEnd(event) {
    const controller = event.target;

    if (controller.userData.selected !== undefined) {
        const object = controller.userData.selected;
        object.material.emissive.b = 0;
        controller.userData.selected = undefined;
    }
}

function getIntersections(controller) {
    tempMatrix.identity().extractRotation(controller.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    return raycaster.intersectObjects(scene.children, true); // true to check descendants
}

function intersectObjects(controller) {
    if (!controller || controller.userData.selected !== undefined) return;

    const line = controller.getObjectByName('line');
    if (!line) return;
    
    const intersections = getIntersections(controller);

    if (intersections.length > 0) {
        const intersection = intersections[0];
        const object = intersection.object;
        object.material.emissive.r = 1;
        intersected.push(object);
        
        // Adjust line to hit position
        line.scale.z = intersection.distance;
    } else {
        // Default ray length when nothing hit
        line.scale.z = 5;
    }
}

function cleanIntersected() {
    while (intersected.length) {
        const object = intersected.pop();
        if (object && object.material) {
            object.material.emissive.r = 0;
        }
    }
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    // Skip if raycaster isn't initialized yet
    if (!raycaster) return;
    
    cleanIntersected();

    // Only check for intersections if controllers exist
    if (controller1) intersectObjects(controller1);
    if (controller2) intersectObjects(controller2);

    renderer.render(scene, camera);
}

// Initialize the application when ready
window.addEventListener('DOMContentLoaded', () => {
    init();
    
    // Set up audio on first user interaction
    window.addEventListener('click', () => {
        if (!audioContext) {
            createAmbientSound();
            createChiptuneMusic();
        }
    }, { once: true });
});
