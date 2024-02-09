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

function onMouseMove(event:any) {
    const mouse = new THREE.Vector2();
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    mouseX = (mouse.x * (camera.right - camera.left) / 2)+camera.position.x;
    mouseY = (mouse.y * (camera.top - camera.bottom) / 2)+camera.position.y

    refreshPosition(mouseX, mouseY);
}

renderer.domElement.addEventListener('mousemove', onMouseMove);


function refreshPosition(mouseX:number, mouseY:number){
	updateRays(mouseX, mouseY);
}


const walls:any = []
function createWall(){
	let wall = [];
	wall.push(new THREE.Vector2(-2, 0));
	wall.push(new THREE.Vector2(0, 2));
	walls.push(wall);
	const material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
	const geometry = new THREE.BufferGeometry().setFromPoints( wall );
	const line = new THREE.Line( geometry, material,);
	scene.add(line);
}

createWall();


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
		const material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
		const geometry = new THREE.BufferGeometry().setFromPoints( oneRay );
		const line = new THREE.Line( geometry, material,);
		rays.push(line);
	}
	return rays;
}

let rays:any = []
function printRays(nRays:number){
	rays = manyRays(nRays, 0, 0);
	for(let i = 0; i<rays.length;i++ ){
		scene.add( rays[i]);
	}
}

function updateRays(mouseX:number, mouseY:number){
	for(let i = 0; i<rays.length;i++ ){
		rays[i].position.set(mouseX, mouseY, 0);
	}
}



printRays(45);
console.log(rays)

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();