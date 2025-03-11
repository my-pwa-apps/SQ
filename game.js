import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let raycaster;
const intersected = [];
const tempMatrix = new THREE.Matrix4();
let isVRMode = false;

const parserInput = document.getElementById('commandInput');
const dialogueDiv = document.getElementById('dialogue');
const inventoryDiv = document.getElementById('inventory');
let inventory = [];
let currentRoom = 'crashSite';

const rooms = {
    crashSite: {
        description: 'You are at the crash site of your spaceship. There is debris everywhere. To the north, you see a path leading to a dense forest.',
        exits: { north: 'forest' },
        items: ['wrench']
    },
    forest: {
        description: 'You are in a dense forest. The trees are tall and the atmosphere is eerie. There is a path leading back to the south and another path leading east.',
        exits: { south: 'crashSite', east: 'spaceBar' },
        items: []
    },
    spaceBar: {
        description: 'You are in a seedy space bar. The place is filled with shady characters and the smell of alien drinks. There is a door to the west.',
        exits: { west: 'forest' },
        items: ['keycard']
    }
};

function renderRoom(room) {
    dialogueDiv.textContent = room.description;
}

function updateInventory() {
    inventoryDiv.textContent = 'Inventory: ' + inventory.join(', ');
}

function handleCommand(command) {
    const [verb, ...args] = command.split(' ');
    const object = args.join(' ');

    switch (verb) {
        case 'look':
            dialogueDiv.textContent = rooms[currentRoom].description;
            break;
        case 'take':
            if (rooms[currentRoom].items.includes(object)) {
                inventory.push(object);
                rooms[currentRoom].items = rooms[currentRoom].items.filter(item => item !== object);
                updateInventory();
                dialogueDiv.textContent = `You take the ${object}.`;
            } else {
                dialogueDiv.textContent = `There is no ${object} here.`;
            }
            break;
        case 'use':
            if (inventory.includes(object)) {
                dialogueDiv.textContent = `You use the ${object}.`;
            } else {
                dialogueDiv.textContent = `You don't have a ${object}.`;
            }
            break;
        case 'go':
            if (rooms[currentRoom].exits[object]) {
                currentRoom = rooms[currentRoom].exits[object];
                renderRoom(rooms[currentRoom]);
            } else {
                dialogueDiv.textContent = `You can't go ${object} from here.`;
            }
            break;
        default:
            dialogueDiv.textContent = `I don't understand the command "${command}".`;
            break;
    }
}

parserInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        handleCommand(parserInput.value);
        parserInput.value = '';
    }
});

init();
animate();

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
}

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
