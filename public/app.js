// app.js
const socket = io();

// DOM
const m1yaw = document.getElementById('m1yaw');
const m1pitch = document.getElementById('m1pitch');
const m1roll = document.getElementById('m1roll');
const m2yaw = document.getElementById('m2yaw');
const m2pitch = document.getElementById('m2pitch');
const m2roll = document.getElementById('m2roll');
const log = document.getElementById('log');

// Chart.js setup (two charts, each showing yaw/pitch/roll as three datasets)
function createChart(ctx, label) {
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: 'Yaw', data: [], borderWidth: 1, tension: 0.25 },
        { label: 'Pitch', data: [], borderWidth: 1, tension: 0.25 },
        { label: 'Roll', data: [], borderWidth: 1, tension: 0.25 },
      ]
    },
    options: {
      responsive: true,
      animation: false,
      plugins: { legend: { display: true } },
      scales: { x: { display: false }, y: { suggestedMin: -180, suggestedMax: 180 } }
    }
  });
}

const ctx1 = document.getElementById('chart1').getContext('2d');
const ctx2 = document.getElementById('chart2').getContext('2d');
const chart1 = createChart(ctx1, 'MPU1');
const chart2 = createChart(ctx2, 'MPU2');

// Utility: limit history points
function pushPoint(chart, yaw, pitch, roll) {
  const now = new Date().toLocaleTimeString();
  chart.data.labels.push(now);
  chart.data.datasets[0].data.push(yaw);
  chart.data.datasets[1].data.push(pitch);
  chart.data.datasets[2].data.push(roll);
  if (chart.data.labels.length > 80) {
    chart.data.labels.shift();
    chart.data.datasets.forEach(ds => ds.data.shift());
  }
  chart.update('none');
}

// Three.js scene with two cubes
let scene, camera, renderer, cube1, cube2, light;
function initThree() {
  const container = document.getElementById('threeCanvas');
  const width = container.clientWidth || 600;
  const height = container.clientHeight || 480;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 2.5, 6);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5,10,7);
  scene.add(light);

  const g = new THREE.BoxGeometry(1.2,1.2,1.2);
  const m1 = new THREE.MeshNormalMaterial();
  const m2 = new THREE.MeshNormalMaterial();

  cube1 = new THREE.Mesh(g, m1);
  cube1.position.set(-1.8, 0.6, 0);
  scene.add(cube1);

  cube2 = new THREE.Mesh(g, m2);
  cube2.position.set(1.8, 0.6, 0);
  scene.add(cube2);

  // axis helpers
  const axes1 = new THREE.AxesHelper(2);
  axes1.position.copy(cube1.position);
  scene.add(axes1);
  const axes2 = new THREE.AxesHelper(2);
  axes2.position.copy(cube2.position);
  scene.add(axes2);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
initThree();

// smoothing function
function lerp(a,b,t){ return a + (b-a)*t; }
let last = { m1: {yaw:0,pitch:0,roll:0}, m2: {yaw:0,pitch:0,roll:0} };

// On receiving sensor data
socket.on('sensor', (msg) => {
  if (!msg || !msg.mpu1 || !msg.mpu2) {
    log.innerText = 'Waiting for valid data...';
    return;
  }
  const m1 = msg.mpu1;
  const m2 = msg.mpu2;

  // update readouts
  m1yaw.innerText = (m1.yaw ?? 0).toFixed(2);
  m1pitch.innerText = (m1.pitch ?? 0).toFixed(2);
  m1roll.innerText = (m1.roll ?? 0).toFixed(2);

  m2yaw.innerText = (m2.yaw ?? 0).toFixed(2);
  m2pitch.innerText = (m2.pitch ?? 0).toFixed(2);
  m2roll.innerText = (m2.roll ?? 0).toFixed(2);

  // push to charts
  pushPoint(chart1, m1.yaw, m1.pitch, m1.roll);
  pushPoint(chart2, m2.yaw, m2.pitch, m2.roll);

  // apply to cubes (convert degrees to radians)
  // Smooth rotation with lerp for better visuals
  last.m1.yaw = lerp(last.m1.yaw, m1.yaw * Math.PI/180, 0.2);
  last.m1.pitch = lerp(last.m1.pitch, m1.pitch * Math.PI/180, 0.2);
  last.m1.roll = lerp(last.m1.roll, m1.roll * Math.PI/180, 0.2);

  last.m2.yaw = lerp(last.m2.yaw, m2.yaw * Math.PI/180, 0.2);
  last.m2.pitch = lerp(last.m2.pitch, m2.pitch * Math.PI/180, 0.2);
  last.m2.roll = lerp(last.m2.roll, m2.roll * Math.PI/180, 0.2);

  cube1.rotation.set(last.m1.pitch, last.m1.yaw, last.m1.roll);
  cube2.rotation.set(last.m2.pitch, last.m2.yaw, last.m2.roll);

  log.innerText = `Last packet: ${new Date(msg.time).toLocaleTimeString()}`;
});
