import * as THREE from 'three';

const scene = new THREE.Scene();
const cameraTresD = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );
const frustumSize = 10;

const heigth  = 750;
const width  = 750;
const aspect = width / heigth;
const camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 1, 1000);

camera.position.set( 0, 0, 50 );
camera.lookAt( 0, 0, 0 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( heigth, width );
document.body.appendChild( renderer.domElement );


let mouseX = 0;
let mouseY = 0;

///------- //  canvas event listeners 

function onMouseMove(event:any) {
    const mouse = new THREE.Vector2();
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    mouseX = (mouse.x * (camera.right - camera.left) / 2)+camera.position.x;
    mouseY = (mouse.y * (camera.top - camera.bottom) / 2)+camera.position.y

    refreshPosition(mouseX, mouseY);
}

function onClick(event:any) {
    const mouse = new THREE.Vector2();
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    mouseX = (mouse.x * (camera.right - camera.left) / 2)+camera.position.x;
    mouseY = (mouse.y * (camera.top - camera.bottom) / 2)+camera.position.y

    console.log(`click x -> ${mouseX}  y ->${mouseY}`);
}


renderer.domElement.addEventListener('click', onClick);
renderer.domElement.addEventListener('mousemove', onMouseMove);


function refreshPosition(mouseX:number, mouseY:number){
    updateRays(mouseX, mouseY);
    clearCasted();
    castRays(mouseX, mouseY);
}

////////--------------------


const walls:any = []
function createWall(xA:number, yA:number, xB:number, yB:number){
    let wall = [];
    wall.push(new THREE.Vector2(xA, yA));
    wall.push(new THREE.Vector2(xB, yB));
    walls.push(wall);
}

function createManyWall(nWalls:number){
    for(let i = 1; i<=nWalls; i++){
        const xA = Math.random() * 10 - 5; 
        const yA = Math.random() * 10 - 5; 
        const xB = Math.random() * 10 - 5; 
        const yB = Math.random() * 10 - 5; 

        createWall(xA, yA, xB, yB);
    }
    printWalls();
}

function printWalls(){
    for(let i = 0; i<walls.length; i++){
        const material = new THREE.LineBasicMaterial( { color: 0x0000ff });
        const geometry = new THREE.BufferGeometry().setFromPoints( walls[i] );
        const line = new THREE.Line( geometry, material,);
        scene.add(line);
    }
}

function createRay(xA:number, yA:number, rad:number){
    const d = 20;
    const xB = xA + d * Math.cos(rad);
    const yB = yA + d * Math.sin(rad);

    const pointA = new THREE.Vector2(xA, yA);
    const pointB = new THREE.Vector2(xB, yB);

    return[pointA, pointB];
}

function manyRays(nRays:number, xA:number, yA:number){
    let rays:any = []
    const degrees = 360 / nRays;
    const rad = degrees * (Math.PI/180);

    for(let i = 1; i<=nRays; i++){
        const oneRay = createRay(xA, yA, rad*i)
        rays.push(oneRay);
    }
    return rays;
}

let raysPostion:any = []
function getManyRays(nRays:number){
    raysPostion = manyRays(nRays, 0, 0);
}

function updateRays(mouseX:number, mouseY:number){
    for (let i = 0; i < raysPostion.length; i++) {
        const diffX = raysPostion[i][1].x - raysPostion[i][0].x;
        const diffY = raysPostion[i][1].y - raysPostion[i][0].y;

        raysPostion[i][0].x = mouseX;
        raysPostion[i][0].y = mouseY;

        raysPostion[i][1].x = mouseX + diffX;
        raysPostion[i][1].y = mouseY + diffY;
    }
}


function clearCasted(){
    for(let i = 0; i<castedRays.length;i++ ){
        scene.remove( castedRays[i]);
    }
    castedRays = [];
}


function castRays(mouseX:number, mouseY:number) {
    for (let i = 0; i < raysPostion.length; i++) {
        let closestIntersection = null;
        let shortestDistance = Infinity;

        for (let j = 0; j < walls.length; j++) {
            const wall = walls[j];
            const ray = raysPostion[i];

            const x1 = wall[0].x, y1 = wall[0].y;
            const x2 = wall[1].x, y2 = wall[1].y;
            const x3 = mouseX, y3 = mouseY;
            const x4 = ray[1].x, y4 = ray[1].y;

            const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (denom === 0) continue; 

            const intersectX = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
            const intersectY = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;

            if (intersectX >= Math.min(x1, x2) && intersectX <= Math.max(x1, x2) &&
                intersectX >= Math.min(x3, x4) && intersectX <= Math.max(x3, x4) &&
                intersectY >= Math.min(y1, y2) && intersectY <= Math.max(y1, y2) &&
                intersectY >= Math.min(y3, y4) && intersectY <= Math.max(y3, y4)) {

                const distance = Math.hypot(mouseX - intersectX, mouseY - intersectY);
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    closestIntersection = { x: intersectX, y: intersectY };
                }
            }
        }

        if (closestIntersection) {
            createLines(mouseX, mouseY, closestIntersection.x, closestIntersection.y);
        }
    }
}

let castedRays:any = [];
function createLines(mouseX:number, mouseY:number, intersectX:number, intersectY:number){
        const points = [];
        points.push( new THREE.Vector3( mouseX, mouseY, 0 ) );
        points.push( new THREE.Vector3( intersectX, intersectY, 0 ) );

        const material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
        const geometry = new THREE.BufferGeometry().setFromPoints( points );
        const line = new THREE.Line( geometry, material,);
        castedRays.push(line)
        scene.add( line );
}

createManyWall(5);
getManyRays(181);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();