import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const loader = new GLTFLoader().setPath('/models/');
loader.load('me.glb', (gltf) => {
  setupScene(gltf);
  document.getElementById('progress-container').style.display = 'none';
}, (xhr) => {
  const percentCompletion = (xhr.loaded / xhr.total) * 100;
  console.log(`Loading model... ${percentCompletion}%`);
  document.getElementById('progress').innerHTML = `LOADING ${percentCompletion}/100`;
}, (error) => {
  console.log(error);
});

function setupScene(gltf) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  renderer.setSize(getMaxWidth(), getMaxHeight());
  renderer.setPixelRatio(window.devicePixelRatio);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const container = document.getElementById('avatar-container');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const mesh = gltf.scene;
  mesh.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(mesh);

  // Create an AnimationMixer, and get the list of AnimationClip instances
  const mixer = new THREE.AnimationMixer(mesh);
  const clips = gltf.animations;

  // Play a specific animation
  const clip = THREE.AnimationClip.findByName(clips, 'Armature_1|mixamo.com|Layer0');
  const action = mixer.clipAction(clip);
  action.play();

  const camera = new THREE.PerspectiveCamera(45, getMaxWidth() / getMaxHeight());

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 4;
  controls.maxDistance = 10;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = 1.5;
  controls.autoRotate = false;
  controls.target = new THREE.Vector3(0, 1, 0);
  controls.update();

  const groundGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 64);
  const groundMaterial = new THREE.MeshStandardMaterial();
  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMesh.castShadow = false;
  groundMesh.receiveShadow = true;
  groundMesh.position.y -= 0.1;
  scene.add(groundMesh);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(ambientLight);

  const spotlight = new THREE.SpotLight(0xffffff, 20, 8, 0.15);
  spotlight.penumbra = 0.5;
  spotlight.position.set(0, 5, 0);
  scene.add(spotlight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(1, 1, 2);
  keyLight.lookAt(new THREE.Vector3());
  keyLight.castShadow = true;
  scene.add(keyLight);

  window.addEventListener('resize', () => {
    camera.aspect = getMaxWidth() / getMaxHeight();
    camera.updateProjectionMatrix();
    renderer.setSize(getMaxWidth(), getMaxHeight());
  });
  
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    mixer.update(clock.getDelta());
    renderer.render(scene, camera);
  }
  
  animate();
}

function getMaxWidth() {
  const container = document.getElementById('avatar-container');
  return Math.min(600, container.offsetWidth);
}

function getMaxHeight() {
  return 500;
}