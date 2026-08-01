import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EvaluationResult, PalletMaterial, PackedPallet } from '../types';
import { toPersianDigits, fmtPersian } from '../utils/persianDigits';
import { pieceWeight } from '../utils/calculation';
import {
  Box,
  Eye,
  RotateCw,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Info,
  Truck,
  Palette,
  Sliders
} from 'lucide-react';

interface Layout3DViewProps {
  evalResult: EvaluationResult;
}

// Color palette for radiator sizes
const SIZE_HEX_COLORS: Record<number, number> = {
  60: 0xeab308,  // Yellow (زرد)
  80: 0xef4444,  // Red (قرمز)
  100: 0x3b82f6, // Blue (آبی)
  120: 0x22c55e, // Green (سبز)
  140: 0xa855f7, // Purple (بنفش)
  160: 0xf97316, // Orange (نارنجی)
  180: 0x64748b  // Gray (طوسی)
};

const DEFAULT_HEX_COLOR = 0x06b6d4; // Cyan for custom sizes

export const Layout3DView: React.FC<Layout3DViewProps> = React.memo(({ evalResult }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const modalMountRef = useRef<HTMLDivElement>(null);

  // UI States
  const [viewPreset, setViewPreset] = useState<'iso' | 'top' | 'side' | 'rear'>('iso');
  const [autoRotate, setAutoRotate] = useState(false);
  const [showContainerWalls, setShowContainerWalls] = useState<'transparent' | 'wireframe' | 'hidden'>('transparent');
  const [colorMode, setColorMode] = useState<'size' | 'realistic'>('size');
  const [layerExplodeGap, setLayerExplodeGap] = useState(0); // vertical spacing between layers
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Hovered item details state
  const [hoveredInfo, setHoveredInfo] = useState<{
    title: string;
    details: string;
    weight: string;
    location: string;
  } | null>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const mainGroupRef = useRef<THREE.Group | null>(null);
  const cargoGroupRef = useRef<THREE.Group | null>(null);
  const containerWallsGroupRef = useRef<THREE.Group | null>(null);
  const layerGroupsRef = useRef<THREE.Group[]>([]);
  const animFrameId = useRef<number | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const interactiveMeshesRef = useRef<{ mesh: THREE.Mesh; data: any }[]>([]);

  if (!evalResult || !evalResult.ok) return null;

  const { truck, packed, packedPallets, ok, lanesCount, usedLayers } = evalResult;

  // Render / Re-render Scene
  useEffect(() => {
    const targetMount = isFullscreen ? modalMountRef.current : mountRef.current;
    if (!targetMount) return;

    // Clear previous canvas
    while (targetMount.firstChild) {
      targetMount.removeChild(targetMount.firstChild);
    }
    interactiveMeshesRef.current = [];
    layerGroupsRef.current = [];

    const width = targetMount.clientWidth || 800;
    const height = isFullscreen ? window.innerHeight - 120 : 420;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isFullscreen ? 0x0f172a : 0xf8fafc);
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    rendererRef.current = renderer;
    targetMount.appendChild(renderer.domElement);

    // 4. OrbitControls with full 360° rotation and multi-touch support
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    controls.enableRotate = true;
    controls.rotateSpeed = 1.0;
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    controls.screenSpacePanning = true;
    controls.minDistance = 5;
    controls.maxDistance = 3000;
    controls.minPolarAngle = 0.01;
    controls.maxPolarAngle = Math.PI / 2 + 0.45; // Allow full 360 azimuth rotation and view under bed level
    
    // Enable multi-touch: single finger for 360° rotation, two fingers for pinch zoom & pan
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    // Prevent default browser scrolling when dragging or pinching inside 3D viewer on touch screens
    renderer.domElement.style.touchAction = 'none';

    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight1.position.set(500, 800, 400);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    dirLight1.shadow.camera.near = 10;
    dirLight1.shadow.camera.far = 2000;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x93c5fd, 0.4);
    dirLight2.position.set(-400, 300, -300);
    scene.add(dirLight2);

    // 6. Main Root Group
    const mainGroup = new THREE.Group();
    mainGroupRef.current = mainGroup;
    scene.add(mainGroup);

    // Scaling Factor: 1 cm in real life = 0.1 units in 3D
    const sc = 0.1;
    const tL = (truck.L || 470) * sc;
    const tW = (truck.W || 220) * sc;
    const tH = 180 * sc; // container height

    // Offset scene center so origin (0,0,0) is center of truck bed
    mainGroup.position.set(-tL / 2, 0, -tW / 2);

    // 7. Ground Shadow / Floor Grid
    const gridHelper = new THREE.GridHelper(Math.max(tL, tW) * 3, 30, 0xcbd5e1, 0xe2e8f0);
    gridHelper.position.set(tL / 2, -1.2, tW / 2);
    mainGroup.add(gridHelper);

    // Truck Bed Floor
    const floorGeo = new THREE.BoxGeometry(tL, 2, tW);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8,
      metalness: 0.2
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(tL / 2, -1, tW / 2);
    floorMesh.receiveShadow = true;
    mainGroup.add(floorMesh);

    // Truck Chassis Beams & Wheels under bed
    const chassisGeo = new THREE.BoxGeometry(tL * 0.9, 4, tW * 0.6);
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.position.set(tL / 2, -4, tW / 2);
    mainGroup.add(chassisMesh);

    // Wheels under truck
    const wheelRadius = 5;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 3, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const wheelPositionsX = [tL * 0.2, tL * 0.75, tL * 0.88];
    wheelPositionsX.forEach((wx) => {
      // Left wheel
      const wheelL = new THREE.Mesh(wheelGeo, wheelMat);
      wheelL.rotation.x = Math.PI / 2;
      wheelL.position.set(wx, -6, -2);
      mainGroup.add(wheelL);
      // Right wheel
      const wheelR = new THREE.Mesh(wheelGeo, wheelMat);
      wheelR.rotation.x = Math.PI / 2;
      wheelR.position.set(wx, -6, tW + 2);
      mainGroup.add(wheelR);
    });

    // Front Cabin (اتاق راننده)
    const cabinL = 25;
    const cabinGeo = new THREE.BoxGeometry(cabinL, tH * 1.05, tW);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4, metalness: 0.5 });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(-cabinL / 2, tH * 0.5, tW / 2);
    cabinMesh.castShadow = true;
    mainGroup.add(cabinMesh);

    // Windshield (شیشه جلو)
    const glassGeo = new THREE.BoxGeometry(cabinL * 0.5, tH * 0.35, tW * 0.9);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.7, roughness: 0.1 });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(-cabinL * 0.4, tH * 0.7, tW / 2);
    mainGroup.add(glassMesh);

    // Headlights
    const lightGeo = new THREE.CylinderGeometry(1.5, 1.5, 1, 12);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const lightL = new THREE.Mesh(lightGeo, lightMat);
    lightL.rotation.z = Math.PI / 2;
    lightL.position.set(-cabinL - 0.2, tH * 0.2, tW * 0.15);
    mainGroup.add(lightL);
    const lightR = new THREE.Mesh(lightGeo, lightMat);
    lightR.rotation.z = Math.PI / 2;
    lightR.position.set(-cabinL - 0.2, tH * 0.2, tW * 0.85);
    mainGroup.add(lightR);

    // 8. Container Walls Group
    const wallsGroup = new THREE.Group();
    containerWallsGroupRef.current = wallsGroup;
    mainGroup.add(wallsGroup);

    // Wireframe outline of container box
    const containerGeo = new THREE.BoxGeometry(tL, tH, tW);
    const edgesGeo = new THREE.EdgesGeometry(containerGeo);
    const edgesMat = new THREE.LineBasicMaterial({ color: 0x475569, linewidth: 2 });
    const containerWire = new THREE.LineSegments(edgesGeo, edgesMat);
    containerWire.position.set(tL / 2, tH / 2, tW / 2);
    wallsGroup.add(containerWire);

    // Semi-transparent side/back wall panels
    if (showContainerWalls === 'transparent') {
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
      });
      // Left side wall
      const leftWallGeo = new THREE.PlaneGeometry(tL, tH);
      const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
      leftWall.rotation.y = Math.PI / 2;
      leftWall.position.set(tL / 2, tH / 2, 0);
      wallsGroup.add(leftWall);

      // Right side wall
      const rightWall = new THREE.Mesh(leftWallGeo, wallMat);
      rightWall.rotation.y = Math.PI / 2;
      rightWall.position.set(tL / 2, tH / 2, tW);
      wallsGroup.add(rightWall);
    }

    // 9. CARGO GROUP (Radiators or Pallets)
    const cargoGroup = new THREE.Group();
    cargoGroupRef.current = cargoGroup;
    mainGroup.add(cargoGroup);

    // Material Colors for Pallets
    const palletColors: Record<PalletMaterial, number> = {
      wooden: 0xb45309,
      metal: 0x475569,
      plastic: 0x2563eb
    };

    // A. PALLET MODE: Render 3D Pallets
    if (packedPallets && packedPallets.length > 0) {
      packedPallets.forEach((pallet, idx) => {
        const pL = pallet.length * sc;
        const pW = pallet.width * sc;
        const pBaseH = (pallet.baseHeight || 15) * sc;
        const pTotalH = (pallet.height || 115) * sc;
        const cargoH = pTotalH - pBaseH;

        const posX = pallet.posX * sc + pL / 2;
        const posZ = pallet.posY * sc + pW / 2;
        const posY = pallet.posZ * sc;

        const palletGroup = new THREE.Group();
        palletGroup.position.set(posX, posY, posZ);

        // Pallet Base (Wood / Metal / Plastic Slats)
        const baseGeo = new THREE.BoxGeometry(pL, pBaseH, pW);
        const baseMat = new THREE.MeshStandardMaterial({
          color: palletColors[pallet.material] || 0xb45309,
          roughness: pallet.material === 'plastic' ? 0.3 : 0.8
        });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.set(0, pBaseH / 2, 0);
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        palletGroup.add(baseMesh);

        // Cargo Stack on Top of Pallet
        const cargoGeo = new THREE.BoxGeometry(pL * 0.94, cargoH, pW * 0.94);
        const cargoMat = new THREE.MeshStandardMaterial({
          color: colorMode === 'size' ? 0x3b82f6 : 0xe2e8f0,
          roughness: 0.4,
          metalness: 0.2
        });
        const cargoMesh = new THREE.Mesh(cargoGeo, cargoMat);
        cargoMesh.position.set(0, pBaseH + cargoH / 2, 0);
        cargoMesh.castShadow = true;
        cargoMesh.receiveShadow = true;
        palletGroup.add(cargoMesh);

        // Edge Outlines for Cargo Block
        const cargoEdgesGeo = new THREE.EdgesGeometry(cargoGeo);
        const cargoEdgesMat = new THREE.LineBasicMaterial({ color: 0x1e3a8a, linewidth: 1.5 });
        const cargoEdges = new THREE.LineSegments(cargoEdgesGeo, cargoEdgesMat);
        cargoEdges.position.set(0, pBaseH + cargoH / 2, 0);
        palletGroup.add(cargoEdges);

        // Visual Strapping / Packaging Lines
        const strapGeo = new THREE.BoxGeometry(pL * 0.96, 0.5, pW * 0.96);
        const strapMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
        const strap1 = new THREE.Mesh(strapGeo, strapMat);
        strap1.position.set(0, pBaseH + cargoH * 0.35, 0);
        palletGroup.add(strap1);

        const strap2 = new THREE.Mesh(strapGeo, strapMat);
        strap2.position.set(0, pBaseH + cargoH * 0.75, 0);
        palletGroup.add(strap2);

        cargoGroup.add(palletGroup);

        // Register for Raycasting Interaction
        interactiveMeshesRef.current.push({
          mesh: cargoMesh,
          data: {
            title: `پالت شماره ${toPersianDigits(idx + 1)} (${pallet.material === 'wooden' ? 'چوبی' : pallet.material === 'metal' ? 'فلزی' : 'پلاستیکی'})`,
            details: pallet.sizeBreakdown
              ? `ترکیب بار: ${pallet.sizeBreakdown} | ابعاد: ${toPersianDigits(pallet.length)}×${toPersianDigits(pallet.width)}cm`
              : `تعداد رادیاتور: ${toPersianDigits(pallet.radiatorCount)} عدد | ابعاد: ${toPersianDigits(pallet.length)}×${toPersianDigits(pallet.width)}cm`,
            weight: `وزن کل: ${fmtPersian(pallet.totalWeight, 0)} kg (کالا: ${fmtPersian(pallet.cargoWeight, 0)} kg + پالت: ${fmtPersian(pallet.tareWeight, 0)} kg)`,
            location: `موقعیت: x=${toPersianDigits(pallet.posX)}cm, y=${toPersianDigits(pallet.posY)}cm`
          }
        });
      });
    }

    // B. DIRECT CARGO LOADING MODE (Radiators arranged in lanes & layers)
    if (packed && packed.length > 0) {
      const laneWidth = tW / (lanesCount || 3);
      const layerH = 11 * sc; // 11cm layer height scaled

      packed.forEach((layer, layerIdx) => {
        if (!layer.lanes || layer.lanes.length === 0) return;

        const layerGroup = new THREE.Group();
        // Set initial vertical position for layer
        const layerY = layerIdx * layerH;
        layerGroup.position.set(0, layerY, 0);
        cargoGroup.add(layerGroup);
        layerGroupsRef.current.push(layerGroup);

        layer.lanes.forEach((lane, laneIdx) => {
          if (!lane.list || lane.list.length === 0) return;

          let currentX = 0; // accumulated X offset along truck length
          const laneZ = laneIdx * laneWidth + laneWidth / 2;

          lane.list.forEach((itemLen, itemIdx) => {
            const radL = itemLen * sc;
            const radW = laneWidth * 0.92;
            const radH = layerH * 0.9;

            const radX = currentX + radL / 2;

            // Determine Box Material Color
            const baseColorHex = colorMode === 'size'
              ? (SIZE_HEX_COLORS[itemLen] || DEFAULT_HEX_COLOR)
              : 0xe2e8f0;

            const radGeo = new THREE.BoxGeometry(radL, radH, radW);
            const radMat = new THREE.MeshStandardMaterial({
              color: baseColorHex,
              roughness: 0.3,
              metalness: 0.25
            });
            const radMesh = new THREE.Mesh(radGeo, radMat);
            radMesh.position.set(radX, radH / 2 + 0.5, laneZ);
            radMesh.castShadow = true;
            radMesh.receiveShadow = true;
            layerGroup.add(radMesh);

            // Black/Dark Outline Edges around each radiator box for crisp visual clarity
            const edgesGeo = new THREE.EdgesGeometry(radGeo);
            const edgesMat = new THREE.LineBasicMaterial({
              color: colorMode === 'size' ? 0x0f172a : 0x475569,
              linewidth: 1.5
            });
            const edgesSeg = new THREE.LineSegments(edgesGeo, edgesMat);
            edgesSeg.position.set(radX, radH / 2 + 0.5, laneZ);
            layerGroup.add(edgesSeg);

            // Top Fin Texture Stripes
            const finGeo = new THREE.BoxGeometry(radL * 0.9, 0.2, radW * 0.85);
            const finMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
            const finMesh = new THREE.Mesh(finGeo, finMat);
            finMesh.position.set(radX, radH + 0.5, laneZ);
            layerGroup.add(finMesh);

            // Register for Raycasting Interaction
            const itemW = pieceWeight(itemLen);
            interactiveMeshesRef.current.push({
              mesh: radMesh,
              data: {
                title: `رادیاتور پنلی ${toPersianDigits(itemLen)} سانتی‌متری`,
                details: `لایه ${toPersianDigits(layerIdx + 1)} | ردیف ${toPersianDigits(laneIdx + 1)} | جایگاه ${toPersianDigits(itemIdx + 1)}`,
                weight: `${fmtPersian(itemW, 1)} kg`,
                location: `طول از کانتینر: ${toPersianDigits(Math.round(currentX / sc))} تا ${toPersianDigits(Math.round((currentX + radL) / sc))} cm`
              }
            });

            currentX += radL; // increment X position
          });
        });
      });
    }

    // Add 3D Center of Gravity (CoG) marker mesh
    if (evalResult.cogX !== undefined && evalResult.cogY !== undefined) {
      const cogScX = evalResult.cogX * sc - tL / 2;
      const cogScY = (evalResult.cogZ || 25) * sc;
      const cogScZ = evalResult.cogY * sc - tW / 2;

      const cogGroup = new THREE.Group();
      cogGroup.name = 'cogGroup';

      // 1. Inner dense glowing core sphere
      const innerCoreGeo = new THREE.SphereGeometry(1.6, 32, 32);
      const innerCoreMat = new THREE.MeshStandardMaterial({
        color: 0xffb703,
        emissive: 0xd97706,
        emissiveIntensity: 1.2,
        roughness: 0.1
      });
      const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
      innerCoreMesh.position.set(cogScX, cogScY, cogScZ);
      cogGroup.add(innerCoreMesh);

      // 2. Outer translucent glowing aura sphere
      const outerSphereGeo = new THREE.SphereGeometry(3.5, 32, 32);
      const outerSphereMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xb45309,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.45,
        roughness: 0.3
      });
      const outerSphereMesh = new THREE.Mesh(outerSphereGeo, outerSphereMat);
      outerSphereMesh.name = 'cogOuterSphere';
      outerSphereMesh.position.set(cogScX, cogScY, cogScZ);
      cogGroup.add(outerSphereMesh);

      // 3. Vertical Laser Drop Line down to floor
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(cogScX, 0.2, cogScZ),
        new THREE.Vector3(cogScX, cogScY, cogScZ)
      ]);
      const lineMat = new THREE.LineDashedMaterial({
        color: 0xf59e0b,
        dashSize: 1.2,
        gapSize: 0.6
      });
      const dropLine = new THREE.Line(lineGeo, lineMat);
      dropLine.computeLineDistances();
      cogGroup.add(dropLine);

      // 4. Target Reticle on Floor (Ring + Crosshair lines)
      const ringGeo = new THREE.RingGeometry(2.2, 3.8, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.name = 'cogFloorRing';
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.set(cogScX, 0.3, cogScZ);
      cogGroup.add(ringMesh);

      // Crosshair lines on floor
      const crosshairGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(cogScX - 5, 0.35, cogScZ),
        new THREE.Vector3(cogScX + 5, 0.35, cogScZ),
        new THREE.Vector3(cogScX, 0.35, cogScZ - 5),
        new THREE.Vector3(cogScX, 0.35, cogScZ + 5)
      ]);
      const crosshairMat = new THREE.LineBasicMaterial({ color: 0xd97706, transparent: true, opacity: 0.9 });
      const crosshairLines = new THREE.LineSegments(crosshairGeo, crosshairMat);
      cogGroup.add(crosshairLines);

      // 5. Text Label Canvas Sprite floating above CG
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.roundRect(10, 10, 236, 44, 10);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = 'bold 20px Tahoma, Arial, sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎯 مرکز ثقل (CG)', 128, 32);
      }

      const labelTexture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(16, 4, 1);
      sprite.position.set(cogScX, cogScY + 5.5, cogScZ);
      cogGroup.add(sprite);

      cargoGroup.add(cogGroup);

      // Register CoG marker for tooltip interaction
      interactiveMeshesRef.current.push({
        mesh: innerCoreMesh,
        data: {
          title: '🎯 نقطه مرکز ثقل کل بار (Center of Gravity)',
          details: `طول X: ${toPersianDigits(evalResult.cogX)}cm (${toPersianDigits(evalResult.cogXPercent || 50)}٪) | عرض Y: ${toPersianDigits(evalResult.cogY)}cm | ارتفاع Z: ${toPersianDigits(evalResult.cogZ || 25)}cm`,
          weight: `سهم اکسل جلو: ${fmtPersian(evalResult.frontAxleWeight, 0)}kg | عقب: ${fmtPersian(evalResult.rearAxleWeight, 0)}kg`,
          location: evalResult.cogStatusLabel || 'مرکز ثقل در محدوده متوازن'
        }
      });
      interactiveMeshesRef.current.push({
        mesh: outerSphereMesh,
        data: {
          title: '🎯 نقطه مرکز ثقل کل بار (Center of Gravity)',
          details: `طول X: ${toPersianDigits(evalResult.cogX)}cm (${toPersianDigits(evalResult.cogXPercent || 50)}٪) | عرض Y: ${toPersianDigits(evalResult.cogY)}cm | ارتفاع Z: ${toPersianDigits(evalResult.cogZ || 25)}cm`,
          weight: `سهم اکسل جلو: ${fmtPersian(evalResult.frontAxleWeight, 0)}kg | عقب: ${fmtPersian(evalResult.rearAxleWeight, 0)}kg`,
          location: evalResult.cogStatusLabel || 'مرکز ثقل در محدوده متوازن'
        }
      });
    }

    // 10. Initial Camera Target Positioning
    setCameraPosition(viewPreset, camera, controls, tL, tW, tH);

    // 11. Animation Loop & Raycasting Setup
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);

      if (autoRotate && controlsRef.current) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 2.0;
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // 12. Mouse move handler for Raycasting Tooltips (Optimized to avoid re-renders on every pixel move)
    const domElem = renderer.domElement;
    const interactiveMeshes = interactiveMeshesRef.current.map((i) => i.mesh);
    let lastHoveredTitle: string | null = null;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = domElem.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (!cameraRef.current || interactiveMeshes.length === 0) return;
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      const intersects = raycasterRef.current.intersectObjects(interactiveMeshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const found = interactiveMeshesRef.current.find((i) => i.mesh === hitMesh);
        if (found) {
          if (lastHoveredTitle !== found.data.title) {
            lastHoveredTitle = found.data.title;
            setHoveredInfo(found.data);
          }
          domElem.style.cursor = 'pointer';
        }
      } else {
        if (lastHoveredTitle !== null) {
          lastHoveredTitle = null;
          setHoveredInfo(null);
        }
        domElem.style.cursor = 'grab';
      }
    };

    domElem.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Cleanup on unmount or re-render (Dispose GPU Geometries, Materials, and Textures)
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      domElem.removeEventListener('mousemove', handleMouseMove);
      controls.dispose();

      scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) {
          const mesh = object as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => mat.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });

      renderer.dispose();
      if (targetMount && renderer.domElement && targetMount.contains(renderer.domElement)) {
        targetMount.removeChild(renderer.domElement);
      }
    };
  }, [evalResult, colorMode, showContainerWalls, isFullscreen]);

  // Update Layer Explode Spacing dynamically without rebuilding full scene
  useEffect(() => {
    if (!layerGroupsRef.current || layerGroupsRef.current.length === 0) return;
    const layerH = 11 * 0.1;
    layerGroupsRef.current.forEach((group, idx) => {
      group.position.y = idx * (layerH + layerExplodeGap * 0.1);
    });
  }, [layerExplodeGap]);

  // Helper to set Camera Preset positions
  const setCameraPosition = (
    preset: 'iso' | 'top' | 'side' | 'rear',
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    tL: number,
    tW: number,
    tH: number
  ) => {
    setViewPreset(preset);
    controls.target.set(0, tH / 2, 0);

    if (preset === 'iso') {
      camera.position.set(tL * 1.4, tL * 1.1, tL * 1.4);
    } else if (preset === 'top') {
      camera.position.set(0, tL * 2.2, 0.1);
    } else if (preset === 'side') {
      camera.position.set(0, tH, tL * 1.6);
    } else if (preset === 'rear') {
      camera.position.set(tL * 1.8, tH, 0);
    }
    controls.update();
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const factor = direction === 'in' ? 0.8 : 1.25;
    cameraRef.current.position.multiplyScalar(factor);
    controlsRef.current.update();
  };

  if (!ok) return null;

  const tL = (truck.L || 470) * 0.1;
  const tW = (truck.W || 220) * 0.1;
  const tH = 180 * 0.1;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-sm my-6 transition-all ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto p-6 bg-slate-950 text-white' : ''
    }`}>
      {/* 3D Viewer Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              طرح سه‌بعدی چیدمان برای {toPersianDigits(usedLayers)} لایه تأیید شده ({truck.name})
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                لایه‌های تأیید شده
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              نمایش سه‌بعدی چیدمان بر اساس لایه‌های تأیید شده و خودرو با بیشترین بهره‌وری ظرفیت ({toPersianDigits(Math.round(evalResult.fill || 0))}٪ پر شده)
            </p>
          </div>
        </div>

        {/* Control Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Camera Presets */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => cameraRef.current && controlsRef.current && setCameraPosition('iso', cameraRef.current, controlsRef.current, tL, tW, tH)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                viewPreset === 'iso' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ایزومتریک
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current && controlsRef.current && setCameraPosition('top', cameraRef.current, controlsRef.current, tL, tW, tH)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                viewPreset === 'top' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              از بالا
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current && controlsRef.current && setCameraPosition('side', cameraRef.current, controlsRef.current, tL, tW, tH)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                viewPreset === 'side' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              جانبی
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current && controlsRef.current && setCameraPosition('rear', cameraRef.current, controlsRef.current, tL, tW, tH)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                viewPreset === 'rear' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              درب عقب
            </button>
          </div>

          {/* Color Mode Toggle */}
          <button
            type="button"
            onClick={() => setColorMode(colorMode === 'size' ? 'realistic' : 'size')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
              colorMode === 'size'
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            {colorMode === 'size' ? 'رنگ بر اساس طول' : 'واقع‌گرایانه (سفید)'}
          </button>

          {/* Auto Rotation Toggle */}
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-xl text-xs font-bold transition border ${
              autoRotate
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
            title="چرخش خودکار 3D"
          >
            <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
          </button>

          {/* Zoom Buttons */}
          <button
            type="button"
            onClick={() => handleZoom('in')}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200"
            title="بزرگ‌نمایی"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom('out')}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200"
            title="کوچک‌نمایی"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Fullscreen Modal Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
            title={isFullscreen ? 'خروج از تمام‌صفحه' : 'نماش تمام‌صفحه'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Layer Explosion Separator Slider */}
      {usedLayers > 1 && (
        <div className="mb-4 p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>فاصله‌گذاری و تفکیک طبقات لایه‌ها (Exploded View):</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={layerExplodeGap}
              onChange={(e) => setLayerExplodeGap(parseInt(e.target.value) || 0)}
              className="w-full sm:w-48 accent-indigo-600"
            />
            <span className="text-xs font-black font-mono text-indigo-700 dark:text-indigo-300 min-w-[50px]">
              {toPersianDigits(layerExplodeGap)} cm
            </span>
          </div>
        </div>
      )}

      {/* 3D Canvas Mount Point Area */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 shadow-inner">
        <div
          ref={isFullscreen ? modalMountRef : mountRef}
          className={`w-full ${isFullscreen ? 'h-[calc(100vh-220px)]' : 'h-[420px]'}`}
        />

        {/* Interactive Hover Tooltip Box */}
        {hoveredInfo && (
          <div className="absolute top-4 right-4 max-w-xs bg-slate-900/90 dark:bg-slate-950/95 text-white p-3.5 rounded-xl border border-slate-700 shadow-xl backdrop-blur-md animate-fadeIn pointer-events-none">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 mb-1">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>{hoveredInfo.title}</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
              {hoveredInfo.details}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between text-[11px]">
              <span className="text-amber-400 font-bold">وزن: {hoveredInfo.weight}</span>
              <span className="text-slate-400">{hoveredInfo.location}</span>
            </div>
          </div>
        )}

        {/* Help Overlay Badge */}
        <div className="absolute top-4 left-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 pointer-events-none shadow-xs">
          <Eye className="w-3.5 h-3.5 text-indigo-500" />
          <span>چرخش کامل ۳۶۰ درجه با ماوس/لمس | زوم دو انگشتی (Pinch Zoom)</span>
        </div>

        {/* Color Legend Footer inside 3D canvas */}
        <div className="absolute bottom-3 right-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">راهنمای رنگ:</span>
            {[60, 80, 100, 120, 140, 160, 180].map((size) => (
              <div key={size} className="flex items-center gap-1 text-[11px]">
                <span
                  className="w-3 h-3 rounded-sm inline-block border border-black/20"
                  style={{
                    backgroundColor: `#${(SIZE_HEX_COLORS[size] || DEFAULT_HEX_COLOR).toString(16).padStart(6, '0')}`
                  }}
                />
                <span>{toPersianDigits(size)}cm</span>
              </div>
            ))}

            {evalResult.cogX !== undefined && (
              <div className="flex items-center gap-1 text-[11px] bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30 font-semibold mr-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                <span>مرکز ثقل (CG): {toPersianDigits(evalResult.cogXPercent || 50)}٪ طولی</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>ارتفاع تجمعی: <b>{toPersianDigits(usedLayers * 11)} cm</b></span>
            <span>|</span>
            <span>طول مفید: <b>{toPersianDigits(truck.L)} cm</b></span>
          </div>
        </div>
      </div>
    </div>
  );
});

Layout3DView.displayName = 'Layout3DView';

