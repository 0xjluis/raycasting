import * as THREE from 'three';

const scene = new THREE.Scene();
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
    printRayPosition();
}


renderer.domElement.addEventListener('click', onClick);
renderer.domElement.addEventListener('mousemove', onMouseMove);


function refreshPosition(mouseX:number, mouseY:number){
    updateRays(mouseX, mouseY);
    clearCollision();
    clearCasted();
    castRays(mouseX, mouseY);
    printColliderShape();
}

////////--------------------


const walls:any = []
function createWall(xA:number, yA:number, xB:number, yB:number){
    let wall = [];
    wall.push(new THREE.Vector2(xA, yA));
    wall.push(new THREE.Vector2(xB, yB));
    walls.push(wall);
}

function createBox() {
    const topLeftX = frustumSize * aspect / -2;
    const topLeftY = frustumSize / 2;

    const topRightX = frustumSize * aspect / 2;
    const topRightY = frustumSize / 2;

    const bottomLeftX = frustumSize * aspect / -2;
    const bottomLeftY = frustumSize / -2;

    const bottomRightX = frustumSize * aspect / 2;
    const bottomRightY = frustumSize / -2;

    createWall(topLeftX, topLeftY, topRightX, topRightY);
    createWall(topRightX, topRightY, bottomRightX, bottomRightY);
    createWall(bottomRightX, bottomRightY, bottomLeftX, bottomLeftY);
    createWall(bottomLeftX, bottomLeftY, topLeftX, topLeftY);
}


function createManyWall(nWalls:number){
    for(let i = 1; i<=nWalls; i++){
        const xA = Math.random() * 10 - 5; 
        const yA = Math.random() * 10 - 5; 
        const xB = Math.random() * 10 - 5; 
        const yB = Math.random() * 10 - 5; 

        createWall(xA, yA, xB, yB);
    }
    createBox()
    printWalls();
}

function printWalls(){
    for(let i = 0; i<walls.length; i++){
        const material = new THREE.LineBasicMaterial( { color: 0xff0000 });
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

function printRayPosition(){
    console.log(raysPostion);
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

let collisionPoints:any = [];
function castRays(mouseX:number, mouseY:number) {
    for (let i = 0; i < raysPostion.length; i++) {
        let closestIntersection = null;
        let shortestDistance = Infinity;

        //console.log(`Ray #${i + 1} Start`);

        for (let j = 0; j < walls.length; j++) {
            const wall = walls[j];
            const ray = raysPostion[i];

            const x1 = wall[0].x, y1 = wall[0].y;
            const x2 = wall[1].x, y2 = wall[1].y;
            const x3 = ray[0].x, y3 = ray[0].y;
            const x4 = ray[1].x, y4 = ray[1].y;

            const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

            if (denom === 0) {
                continue;
            }

            const intersectX = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
            const intersectY = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;

           //console.log(`Wall #${j + 1}: Intersect at (${intersectX}, ${intersectY})`);

            const tolerance = 1e-6;

            if (intersectX >= Math.min(x1, x2) - tolerance && intersectX <= Math.max(x1, x2) + tolerance &&
                intersectX >= Math.min(x3, x4) - tolerance && intersectX <= Math.max(x3, x4) + tolerance &&
                intersectY >= Math.min(y1, y2) - tolerance && intersectY <= Math.max(y1, y2) + tolerance &&
                intersectY >= Math.min(y3, y4) - tolerance && intersectY <= Math.max(y3, y4) + tolerance) {

                const distance = Math.hypot(mouseX - intersectX, mouseY - intersectY);
                //console.log(`Intersection within bounds. Distance: ${distance}`);

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    closestIntersection = { x: intersectX, y: intersectY };
                }
            } else {
                //console.log(`Intersection out of bounds. X: ${intersectX}, Y: ${intersectY}`);
            }
        }

        if (closestIntersection) {
            //console.log(`Closest intersection at (${closestIntersection.x}, ${closestIntersection.y}).`);
            createLines(mouseX, mouseY, closestIntersection.x, closestIntersection.y);
            collisionPoints.push(new THREE.Vector3( closestIntersection.x, closestIntersection.y, shortestDistance ));
        } else {
            ///console.log(`😁 No intersection found for ray #${i + 1}.`);
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

function closeCollider(){
    const start = collisionPoints[0];
    collisionPoints.push(new THREE.Vector3( start.x, start.y, 0 ));
}

let printedCollider:any = null;
function printColliderShape(){
    closeCollider();
    const material = new THREE.LineBasicMaterial( { color: 0x00ff00 });
    const geometry = new THREE.BufferGeometry().setFromPoints( collisionPoints );
    const line = new THREE.Line( geometry, material,);
    printedCollider = line;
    scene.add(line);
}

function clearCollision(){
    scene.remove( printedCollider);    
    collisionPoints = [];
    printedCollider = []
}




createManyWall(6);
getManyRays(90);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();



