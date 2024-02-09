import * as THREE from 'three';

const scene = new THREE.Scene();
const cameraTresD = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );
const frustumSize = 10;

const heigth  = 500;
const width  = 500;
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
    printRays();
    castRays(mouseX, mouseY);
}


renderer.domElement.addEventListener('click', onClick);
renderer.domElement.addEventListener('mousemove', onMouseMove);


function refreshPosition(mouseX:number, mouseY:number){
	//updateWalls(mouseX, mouseY);
    updateRays(mouseX, mouseY);
    //updateRaysLive(mouseX, mouseY);

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
        createWall(-4, 0+3, 3, -2*i);
    }
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
    const d = 8;
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

function updateRaysLive(mouseX:number, mouseY:number){
    for(let i = 0; i<raysLines.length;i++ ){
        raysLines[i].position.set(mouseX, mouseY, 0);
    }
}

let raysLines:any = [];
function printRays(){
    for(let i = 0; i<raysPostion.length;i++ ){
        const material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
        const geometry = new THREE.BufferGeometry().setFromPoints( raysPostion[i] );
        const line = new THREE.Line( geometry, material,);
        raysLines.push(line);
        scene.add( line);
    }
}

let castedRays = [];
function castRays(){
    for(let i = 0; i< walls.length; i++){
        for(let j = 0; j<raysPostion.length; j++){

            const x1 = walls[i][0].x, y1 = walls[i][0].y;
            const x2 = walls[i][1].x, y2 = walls[i][1].y;
            const x3 = raysPostion[j][0].x, y3 = raysPostion[j][0].y;
            const x4 = raysPostion[j][1].x, y4 = raysPostion[j][1].y;

            const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (denom === 0) {
                return null; // Las líneas son paralelas o coincidentes
            }
            console.log("Hola");

            const intersectX = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
            const intersectY = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;

            //ceck point inside segment 
            if (intersectX < Math.min(x1, x2) || intersectX > Math.max(x1, x2) ||
                    intersectX < Math.min(x3, x4) || intersectX > Math.max(x3, x4) ||
                    intersectY < Math.min(y1, y2) || intersectY > Math.max(y1, y2) ||
                    intersectY < Math.min(y3, y4) || intersectY > Math.max(y3, y4)) {
                    continue; 
                }



            const geometry = new THREE.BoxGeometry( 0.5, 0.5, 1 );
            const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
            const cube = new THREE.Mesh( geometry, material );
            cube.position.set(intersectX, intersectY, 0);
            scene.add(cube);
        }
    }
}



createManyWall(1);
printWalls()

getManyRays(36);


function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();