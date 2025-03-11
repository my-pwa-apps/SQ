let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let raycaster;
const intersected = [];
const tempMatrix = new THREE.Matrix4();
let isVRMode = false;

function createAmbientSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioContext.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.1;

    whiteNoise.connect(gainNode);
    gainNode.connect(audioContext.destination);
    whiteNoise.start(0);
}

function createChiptuneMusic() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();

    // Simple chiptune melody
    const melody = [440, 494, 523, 587, 659, 698, 784, 880];
    let index = 0;

    setInterval(() => {
        oscillator.frequency.setValueAtTime(melody[index], audioContext.currentTime);
        index = (index + 1) % melody.length;
    }, 500);
}

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 3);

    const light = new THREE.HemisphereLight(0xffffff, 0x444444);
    light.position.set(0, 1, 0);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    document.getElementById('vrButton').addEventListener('click', () => {
        document.body.appendChild(VRButton.createButton(renderer));
    });

    document.getElementById('toggleVRButton').addEventListener('click', toggleVRMode);

    // Controllers
    controller1 = renderer.xr.getController(0);
    controller1.addEventListener('selectstart', onSelectStart);
    controller1.addEventListener('selectend', onSelectEnd);
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);
    scene.add(controller2);

    const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    raycaster = new THREE.Raycaster();

    window.addEventListener('resize', onWindowResize, false);

    // Example objects
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    const keycard = new THREE.Mesh(geometry, material);
    keycard.name = 'keycard';
    keycard.position.set(0, 1.5, -1);
    scene.add(keycard);

    const npc1 = new THREE.Mesh(geometry, material);
    npc1.name = 'npc1';
    npc1.position.set(1, 1.5, -1);
    scene.add(npc1);

    // Create ambient sound and chiptune music
    createAmbientSound();
    createChiptuneMusic();

    // Desktop interaction
    window.addEventListener('click', onMouseClick, false);
}

function onMouseClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

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
    switch (command.toLowerCase()) {
        case 'look at':
            // Handle look at command
            break;
        case 'talk to':
            // Handle talk to command
            break;
        case 'use':
            // Handle use command
            break;
        case 'pick up':
            // Handle pick up command
            break;
        default:
            console.log('Unknown command');
    }
}

document.getElementById('parserInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const command = event.target.value;
        handleCommand(command);
        event.target.value = '';
    }
});

// Inventory System
const inventory = [];

function addToInventory(item) {
    inventory.push(item);
    document.getElementById('inventory').innerText = 'Inventory: ' + inventory.join(', ');
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
    if (dialogue) {
        let dialogueIndex = 0;
        const dialogueElement = document.getElementById('dialogue');
        dialogueElement.innerText = dialogue[dialogueIndex];

        dialogueElement.addEventListener('click', () => {
            dialogueIndex++;
            if (dialogueIndex < dialogue.length) {
                dialogueElement.innerText = dialogue[dialogueIndex];
            } else {
                dialogueElement.innerText = 'Dialogue: ';
            }
        });
    }
}

// Example usage
addToInventory('Keycard');
startDialogue('npc1');

function toggleVRMode() {
    isVRMode = !isVRMode;
    if (isVRMode) {
        document.body.appendChild(VRButton.createButton(renderer));
    } else {
        const vrButton = document.querySelector('.vr-button');
        if (vrButton) {
            vrButton.remove();
        }
        renderer.xr.enabled = false;
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

    return raycaster.intersectObjects(scene.children);
}

function intersectObjects(controller) {
    if (controller.userData.selected !== undefined) return;

    const line = controller.getObjectByName('line');
    const intersections = getIntersections(controller);

    if (intersections.length > 0) {
        const intersection = intersections[0];
        const object = intersection.object;
        object.material.emissive.r = 1;
        intersected.push(object);
    } else {
        line.scale.z = 10;
    }
}

function cleanIntersected() {
    while (intersected.length) {
        const object = intersected.pop();
        object.material.emissive.r = 0;
    }
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    cleanIntersected();

    intersectObjects(controller1);
    intersectObjects(controller2);

    renderer.render(scene, camera);
}
