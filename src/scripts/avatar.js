import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const loader = new GLTFLoader().setPath('/models/');
loader.load('me.glb', (gltf) => {
  setupScene(gltf);
  document.getElementById('avatar-loading').style.display = 'none';
}, (xhr) => {
  const percentCompletion = (xhr.loaded / xhr.total) * 100;
  console.log(`Loading model... ${percentCompletion}%`);
}, (error) => {
  console.log(error);
});

function setupScene(gltf) {
  // RENDERER
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  renderer.setSize(getMaxWidth(), getMaxHeight());
  renderer.setPixelRatio(window.devicePixelRatio);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const container = document.getElementById('avatar-container');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  // CAMERRA CONTROLS
  const camera = new THREE.PerspectiveCamera(45, getMaxWidth() / getMaxHeight());
  camera.position.y = 0.1;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minDistance = 3.75;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = 1.5;
  controls.target = new THREE.Vector3(0, 0.75, 0);
  controls.update();

  const raycaster = new THREE.Raycaster();
  
  // LIGHTING
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const spotlight = new THREE.SpotLight(0xffffff, 20, 8, 0.2);
  spotlight.penumbra = 0.5;
  spotlight.position.set(0, 5, 2);
  spotlight.castShadow = true;
  scene.add(spotlight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2);
  keyLight.position.set(1, 1, 2);
  keyLight.lookAt(new THREE.Vector3());
  scene.add(keyLight);

  // MESHES
  // Create pedestal
  const groundGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 64);
  const groundMaterial = new THREE.MeshStandardMaterial();
  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMesh.castShadow = false;
  groundMesh.receiveShadow = true;
  groundMesh.position.y -= 0.1;
  scene.add(groundMesh);

  // Load avatar
  const avatar = gltf.scene;
  avatar.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(avatar);

  // ANIMATION
  const mixer = new THREE.AnimationMixer(avatar);
  const clips = gltf.animations;
  const waveClip = THREE.AnimationClip.findByName(clips, 'wave');
  const stumbleClip = THREE.AnimationClip.findByName(clips, 'stumble');
  const waveAction = mixer.clipAction(waveClip);
  const stumbleAction = mixer.clipAction(stumbleClip);
  waveAction.play();

  let isStumbling = false;

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    mixer.update(clock.getDelta());
    renderer.render(scene, camera);
  }
  
  function triggerAvatarStumble(coords) {
    raycaster.setFromCamera(coords, camera);

    const intersections = raycaster.intersectObject(avatar);

    if (intersections.length > 0) {
      // If avatar is already stumbling, exit early
      if (isStumbling) return;

      // Fade in the stumble animation
      isStumbling = true;
      stumbleAction.reset();
      stumbleAction.play();
      waveAction.crossFadeTo(stumbleAction, 0.3);

      // Wait two seconds to fade the waving animation back in
      setTimeout(() => {
        waveAction.reset();
        waveAction.play();
        stumbleAction.crossFadeTo(waveAction, 1)

        // Wait a bit before we allow the avatar to stumble again
        setTimeout(() => isStumbling = false, 1000);
      }, 4000)
    }
  }

  window.addEventListener('mousedown', (ev) => {
    const coords = {
      x: (ev.clientX / window.innerWidth) * 2 - 1,
      y: -(ev.clientY / window.innerHeight) * 2 + 1
    };
    triggerAvatarStumble(coords)
  });

  window.addEventListener('touchstart', (ev) => {
    // This prevents 'mousedown' from firing as well
    ev.preventDefault();
    if (ev.touches.length > 0) {
      const coords = {
        x: (ev.touches[0].clientX / window.innerWidth) * 2 - 1,
        y: -(ev.touches[0].clientY / window.innerHeight) * 2 + 1
      };
      triggerAvatarStumble(coords)
    }
  }, { passive: false });
  
  window.addEventListener('resize', () => {
    camera.aspect = getMaxWidth() / getMaxHeight();
    camera.updateProjectionMatrix();
    renderer.setSize(getMaxWidth(), getMaxHeight());
  });

  animate();
}

function getMaxWidth() {
  const container = document.getElementById('avatar-container');
  return container.offsetWidth;
}

function getMaxHeight() {
  return 500;
}