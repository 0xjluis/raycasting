import * as THREE from 'three';

////////---------------SCENE ONE

const scene = new THREE.Scene();
const frustumSize = 10;

const heigth  = 400;
const width  = 800;
const aspect = width / heigth;
const camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 1, 1000);

camera.position.set( 0, 0, 50 );
camera.lookAt( 0, 0, 0 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, heigth);
document.body.appendChild( renderer.domElement );

let mouseX = 0;
let mouseY = 0;

/////////---------- EVENTS 

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
    logLength();
}


renderer.domElement.addEventListener('click', onClick);
renderer.domElement.addEventListener('mousemove', onMouseMove);


function refreshPosition(mouseX:number, mouseY:number){
    updateRays(mouseX, mouseY);
    clearCollision();
    clearCasted();
    castRays(mouseX, mouseY);
    printColliderShape();
    //clearPrintedSegments();
    //printPartialWalls()
    clearPartialSegments();
    clearLength();
    calcLength();
    printCosas()
}

////////--------------------


const walls:any = []
function createWall(xA:number, yA:number, xB:number, yB:number){
    let wall = [];
    wall.push(new THREE.Vector2(xA, yA));
    wall.push(new THREE.Vector2(xB, yB));
    walls.push(wall);
    wallsData.push({intersections: []});
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
        console.log(xA, yA, xB, yB)
        createWall(xA, yA, xB, yB);
    }
    createBox()
    printWalls();
}

function createVericalWall(){
    const xA = 2;
    const yA = 5;
    const xB = 2;
    const yB = -5;
    createWall(xA, yA, xB, yB);
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
    const degrees = 60 / nRays;
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

let newSegments:any = [];
let collisionPoints:any = [];
let collisionData:any = [];
let wallsData:any = []
function castRays(mouseX:number, mouseY:number) {
    wallsData.forEach((data:any) => data.intersections = []);
    for (let i = 0; i < raysPostion.length; i++) {
        let closestIntersection = null;
        let shortestDistance = Infinity;
        let wallN = -1;
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
                    wallN = j;
                }
            } else {
                //console.log(`Intersection out of bounds. X: ${intersectX}, Y: ${intersectY}`);
            }
        }

        if (closestIntersection && wallN === -1) {
            console.log("😁😁😁😁 WUTTTTTT???")
        }

        if (closestIntersection && wallN !== -1) {
            //console.log(`Closest intersection at (${closestIntersection.x}, ${closestIntersection.y}).`);
            createLines(mouseX, mouseY, closestIntersection.x, closestIntersection.y);
            collisionPoints.push(new THREE.Vector3( closestIntersection.x, closestIntersection.y, shortestDistance ));
            const dataCollision = { x:closestIntersection.x, y:closestIntersection.y , z: shortestDistance, wall: wallN}
            collisionData.push(dataCollision)
            wallsData[wallN].intersections.push({
                rayIndex: i,
                point: closestIntersection,
                distance: shortestDistance
            });
            
        } else {
            ///console.log(`😁 No intersection found for ray #${i + 1}.`);
        }
    }


   

    //console.log(newSegments);
}

function getRandomInt(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
}

function clearPartialSegments(){
    newSegments = [];
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
    //closeCollider();
    //console.log(collisionPoints)
    const material = new THREE.LineBasicMaterial( { color: 0x00ff00 });
    const geometry = new THREE.BufferGeometry().setFromPoints( collisionPoints );
    const line = new THREE.Line( geometry, material,);
    printedCollider = line;
    scene.add(line);
}

function clearCollision(){
    scene.remove( printedCollider);    
    collisionPoints = [];
    printedCollider = [];
    collisionData = [];
}


createManyWall(10);
//createVericalWall();
getManyRays(360);

////////---------------------- 3D SCENE


const sceneDos = new THREE.Scene();
const cameraDos = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 1, 1000);

cameraDos.position.set( 0, 0, 50 );
cameraDos.lookAt( 0, 0, 0 );

const rendererDos = new THREE.WebGLRenderer();
rendererDos.setSize( width, heigth );
document.body.appendChild( rendererDos.domElement );

function clearLength(){
    for(let i = 0; i<printedLengths.length;i++ ){
        sceneDos.remove( printedLengths[i]);
    }
    lengths = [];
    printedLengths = [];
}

let lengths:any = [];
function calcLength(){
    let xPosition = -10;
    for (let i = 0; i < collisionData.length - 1; i++) {
        const puntoInicio = collisionData[i];
        const puntoFin = collisionData[i + 1];

        const longitud1 = Math.sqrt(((puntoFin.x - puntoInicio.x) ** 2) + ((puntoFin.y - puntoInicio.y) ** 2));
        const segmentStartX = xPosition + longitud1 / 2;

        if(collisionData[i].wall !== collisionData[i+1].wall){
            continue;
        }

        let r = getRandomInt(256); 
        let g = getRandomInt(256);
        let b = getRandomInt(256);
      
        let rgb = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

        lengths.push([
            segmentStartX, longitud1, puntoInicio.z, puntoFin.z, rgb
        ]);

        xPosition = xPosition + longitud1;
    }
}

function logLength(){
    console.log(lengths)

}

let printedLengths:any = [];
function printCosas(){
    for (let i = 0; i < lengths.length; i++){

        

        let distMean = (lengths[i][2] + lengths[i][3])/2

        const inversaD = 10/distMean

        const geometry = new THREE.PlaneGeometry(lengths[i][1], inversaD); 
        const material = new THREE.MeshBasicMaterial({ color: lengths[i][4], side: THREE.DoubleSide });
        const plane = new THREE.Mesh(geometry, material);

        plane.position.set(lengths[i][0], 0, 1);
        printedLengths.push(plane);
        sceneDos.add(plane);
    }
}



////////---------------------- Animation

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    rendererDos.render(sceneDos, cameraDos);
}

animate();