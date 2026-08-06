import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EvaluationResult, PalletMaterial, PackedPallet } from '../types';
import { toPersianDigits, fmtPersian } from '../utils/persianDigits';
import { pieceWeight, getPackagedLength } from '../utils/calculation';
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
  Sliders,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Scale,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface Layout3DViewProps {
  evalResult: EvaluationResult;
}

// Color palette for radiator sizes
const SIZE_HEX_COLORS: Record<number, number> = {
  40: 0xec4899,  // Pink
  60: 0xeab308,  // Yellow (زرد)
  80: 0xef4444,  // Red (قرمز)
  100: 0x3b82f6, // Blue (آبی)
  120: 0x22c55e, // Green (سبز)
  140: 0xa855f7, // Purple (بنفش)
  160: 0xf97316, // Orange (نارنجی)
  180: 0x64748b, // Gray (طوسی)
  200: 0x06b6d4  // Cyan
};

const DEFAULT_HEX_COLOR = 0x06b6d4; // Cyan for custom sizes

// Group colors for multi-stop grouping (Matching screenshots A, B, C, D badges)
const GROUP_COLORS = [
  { name: 'گروه ۱ (ایستگاه اول)', hex: 0xef4444, bgClass: 'bg-red-500', textClass: 'text-red-500', badge: 'A' },
  { name: 'گروه ۲ (ایستگاه دوم)', hex: 0xeab308, bgClass: 'bg-amber-500', textClass: 'text-amber-500', badge: 'B' },
  { name: 'گروه ۳ (ایستگاه سوم)', hex: 0x22c55e, bgClass: 'bg-emerald-500', textClass: 'text-emerald-500', badge: 'C' },
  { name: 'گروه ۴ (ایستگاه چهارم)', hex: 0x3b82f6, bgClass: 'bg-blue-500', textClass: 'text-blue-500', badge: 'D' },
];

/**
 * Creates dynamic canvas texture for top/side faces of 3D boxes with printed text
 */
function createBoxLabelTexture(label: string, subLabel: string, bgHex: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const hexStr = `#${bgHex.toString(16).padStart(6, '0')}`;
    ctx.fillStyle = hexStr;
    ctx.fillRect(0, 0, 256, 128);

    // Inner outline
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 248, 120);

    // Top banner strip
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(4, 4, 248, 30);

    // Main Code / Label
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px Tahoma, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 128, 62);

    // Subtitle / Dimensions & Weight
    ctx.font = 'bold 13px Tahoma, Arial, sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(subLabel, 128, 98);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

export const Layout3DView: React.FC<Layout3DViewProps> = React.memo(({ evalResult }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const modalMountRef = useRef<HTMLDivElement>(null);
  const miniPreviewMountRef = useRef<HTMLDivElement>(null);

  // UI States
  const [viewPreset, setViewPreset] = useState<'iso' | 'top' | 'side' | 'rear' | 'axle'>('iso');
  const [autoRotate, setAutoRotate] = useState(false);
  const [showContainerWalls, setShowContainerWalls] = useState<'transparent' | 'wireframe' | 'hidden'>('transparent');
  const [colorMode, setColorMode] = useState<'size' | 'group' | 'realistic'>('size');
  const [layerExplodeGap, setLayerExplodeGap] = useState(0); // vertical spacing between layers
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showPIPViews, setShowPIPViews] = useState(true);

  // Loading Step Animation State (Step-by-step loading simulation)
  const [currentStep, setCurrentStep] = useState<number>(9999);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [totalItemsCount, setTotalItemsCount] = useState<number>(0);

  // Selected item detail state
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number>(0);
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
  const boxMeshesRef = useRef<THREE.Mesh[]>([]);
  const animFrameId = useRef<number | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const interactiveMeshesRef = useRef<{ mesh: THREE.Mesh; data: any; index: number }[]>([]);

  // Safely extract properties from evalResult
  const ok = evalResult?.ok ?? false;
  const truck = evalResult?.truck;
  const packed = evalResult?.packed || [];
  const packedPallets = evalResult?.packedPallets || [];
  const lanesCount = evalResult?.lanesCount || 1;
  const usedLayers = evalResult?.usedLayers || 1;

  // Calculate total box count
  useEffect(() => {
    let count = 0;
    if (packedPallets && packedPallets.length > 0) {
      count = packedPallets.length;
    } else if (packed && packed.length > 0) {
      packed.forEach(layer => {
        layer.lanes.forEach(lane => {
          count += lane.list.length;
        });
      });
    }
    setTotalItemsCount(count);
    setCurrentStep(count); // Start fully loaded by default
  }, [packed, packedPallets]);

  // Step Animation Playback Timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= totalItemsCount) {
          setIsPlaying(false);
          return totalItemsCount;
        }
        return prev + 1;
      });
    }, 400 / playbackSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, totalItemsCount, playbackSpeed]);

  // Update box visibility when currentStep changes
  useEffect(() => {
    if (!boxMeshesRef.current || boxMeshesRef.current.length === 0) return;
    boxMeshesRef.current.forEach((mesh, idx) => {
      mesh.visible = idx < currentStep;
    });
  }, [currentStep]);

  // Render / Re-render 3D Scene
  useEffect(() => {
    if (!evalResult || !evalResult.ok || !evalResult.truck) return;

    const targetMount = isFullscreen ? modalMountRef.current : mountRef.current;
    if (!targetMount) return;

    // Clear previous canvas
    while (targetMount.firstChild) {
      targetMount.removeChild(targetMount.firstChild);
    }
    interactiveMeshesRef.current = [];
    layerGroupsRef.current = [];
    boxMeshesRef.current = [];

    const width = targetMount.clientWidth || 800;
    const height = isFullscreen ? window.innerHeight - 120 : 440;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isFullscreen ? 0x090d16 : 0x0f172a); // Deep blue-gray dark canvas like EasyCargo
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    rendererRef.current = renderer;
    targetMount.appendChild(renderer.domElement);

    // 4. OrbitControls
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
    controls.maxPolarAngle = Math.PI / 2 + 0.45;
    
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    renderer.domElement.style.touchAction = 'none';
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight1.position.set(500, 800, 400);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.45);
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

    // 7. Ground Grid & Reflective Bed
    const gridHelper = new THREE.GridHelper(Math.max(tL, tW) * 3, 30, 0x334155, 0x1e293b);
    gridHelper.position.set(tL / 2, -1.2, tW / 2);
    mainGroup.add(gridHelper);

    // Truck Bed Floor
    const floorGeo = new THREE.BoxGeometry(tL, 2, tW);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      metalness: 0.3
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(tL / 2, -1, tW / 2);
    floorMesh.receiveShadow = true;
    mainGroup.add(floorMesh);

    // Truck Chassis Beams & Wheels under bed
    const chassisGeo = new THREE.BoxGeometry(tL * 0.9, 4, tW * 0.6);
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.position.set(tL / 2, -4, tW / 2);
    mainGroup.add(chassisMesh);

    // Wheels under truck
    const wheelRadius = 5;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 3, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.9 });
    const wheelPositionsX = [tL * 0.2, tL * 0.75, tL * 0.88];
    wheelPositionsX.forEach((wx) => {
      const wheelL = new THREE.Mesh(wheelGeo, wheelMat);
      wheelL.rotation.x = Math.PI / 2;
      wheelL.position.set(wx, -6, -2);
      mainGroup.add(wheelL);

      const wheelR = new THREE.Mesh(wheelGeo, wheelMat);
      wheelR.rotation.x = Math.PI / 2;
      wheelR.position.set(wx, -6, tW + 2);
      mainGroup.add(wheelR);
    });

    // Front Cabin (اتاق راننده)
    const cabinL = 25;
    const cabinGeo = new THREE.BoxGeometry(cabinL, tH * 1.05, tW);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4, metalness: 0.5 });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(-cabinL / 2, tH * 0.5, tW / 2);
    cabinMesh.castShadow = true;
    mainGroup.add(cabinMesh);

    // Windshield (شیشه جلو)
    const glassGeo = new THREE.BoxGeometry(cabinL * 0.5, tH * 0.35, tW * 0.9);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.7, roughness: 0.1 });
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

    // Rear Container Doors (Open Frame)
    const doorFrameGeo = new THREE.BoxGeometry(1.5, tH, 3);
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const doorL = new THREE.Mesh(doorFrameGeo, doorFrameMat);
    doorL.position.set(tL + 0.75, tH / 2, 1.5);
    mainGroup.add(doorL);
    const doorR = new THREE.Mesh(doorFrameGeo, doorFrameMat);
    doorR.position.set(tL + 0.75, tH / 2, tW - 1.5);
    mainGroup.add(doorR);

    // 8. Container Walls Group
    const wallsGroup = new THREE.Group();
    containerWallsGroupRef.current = wallsGroup;
    mainGroup.add(wallsGroup);

    // Wireframe outline of container box
    const containerGeo = new THREE.BoxGeometry(tL, tH, tW);
    const edgesGeo = new THREE.EdgesGeometry(containerGeo);
    const edgesMat = new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 2 });
    const containerWire = new THREE.LineSegments(edgesGeo, edgesMat);
    containerWire.position.set(tL / 2, tH / 2, tW / 2);
    wallsGroup.add(containerWire);

    // Semi-transparent side/back wall panels
    if (showContainerWalls === 'transparent') {
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide
      });
      const leftWallGeo = new THREE.PlaneGeometry(tL, tH);
      const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
      leftWall.rotation.y = Math.PI / 2;
      leftWall.position.set(tL / 2, tH / 2, 0);
      wallsGroup.add(leftWall);

      const rightWall = new THREE.Mesh(leftWallGeo, wallMat);
      rightWall.rotation.y = Math.PI / 2;
      rightWall.position.set(tL / 2, tH / 2, tW);
      wallsGroup.add(rightWall);
    }

    // 9. CARGO GROUP (Radiators or Pallets)
    const cargoGroup = new THREE.Group();
    cargoGroupRef.current = cargoGroup;
    mainGroup.add(cargoGroup);

    const palletColors: Record<PalletMaterial, number> = {
      wooden: 0xb45309,
      metal: 0x475569,
      plastic: 0x2563eb
    };

    let globalBoxIndex = 0;

    // A. PALLET MODE: Render 3D Pallets
    if (packedPallets && packedPallets.length > 0) {
      packedPallets.forEach((pallet, idx) => {
        if (!pallet) return;
        const pL = (pallet.length || 100) * sc;
        const pW = (pallet.width || 80) * sc;
        const pBaseH = (pallet.baseHeight || 15) * sc;
        const pTotalH = (pallet.height || 115) * sc;
        const cargoH = Math.max(10, pTotalH - pBaseH);

        const posX = (pallet.posX ?? 0) * sc + pL / 2;
        const posZ = (pallet.posY ?? 0) * sc + pW / 2;
        const posY = (pallet.posZ ?? 0) * sc;

        const palletGroup = new THREE.Group();
        palletGroup.position.set(posX, posY, posZ);

        // Pallet Base
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

        // Cargo Stack on Top of Pallet with dynamic printed label texture
        const labelText = `Num ${idx + 1}-${pallet.material === 'wooden' ? 'W' : 'P'}`;
        const subText = `${pallet.length}x${pallet.width}cm | ${Math.round(pallet.totalWeight)}kg`;
        const cargoLabelTexture = createBoxLabelTexture(labelText, subText, 0x3b82f6);

        const cargoGeo = new THREE.BoxGeometry(pL * 0.94, cargoH, pW * 0.94);
        const topMat = new THREE.MeshStandardMaterial({ map: cargoLabelTexture, roughness: 0.3 });
        const sideMat = new THREE.MeshStandardMaterial({
          color: colorMode === 'size' ? 0x3b82f6 : 0xe2e8f0,
          roughness: 0.4
        });
        const materials = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];

        const cargoMesh = new THREE.Mesh(cargoGeo, materials);
        cargoMesh.position.set(0, pBaseH + cargoH / 2, 0);
        cargoMesh.castShadow = true;
        cargoMesh.receiveShadow = true;
        palletGroup.add(cargoMesh);

        // Edge Outlines
        const cargoEdgesGeo = new THREE.EdgesGeometry(cargoGeo);
        const cargoEdgesMat = new THREE.LineBasicMaterial({ color: 0x1e3a8a, linewidth: 1.5 });
        const cargoEdges = new THREE.LineSegments(cargoEdgesGeo, cargoEdgesMat);
        cargoEdges.position.set(0, pBaseH + cargoH / 2, 0);
        palletGroup.add(cargoEdges);

        cargoGroup.add(palletGroup);
        boxMeshesRef.current.push(cargoMesh);

        interactiveMeshesRef.current.push({
          mesh: cargoMesh,
          index: globalBoxIndex,
          data: {
            title: `پالت شماره ${toPersianDigits(idx + 1)} (${pallet.material === 'wooden' ? 'چوبی' : pallet.material === 'metal' ? 'فلزی' : 'پلاستیکی'})`,
            details: pallet.sizeBreakdown
              ? `ترکیب بار: ${pallet.sizeBreakdown} | ابعاد: ${toPersianDigits(pallet.length)}×${toPersianDigits(pallet.width)}cm`
              : `تعداد رادیاتور: ${toPersianDigits(pallet.radiatorCount)} عدد | ابعاد: ${toPersianDigits(pallet.length)}×${toPersianDigits(pallet.width)}cm`,
            weight: `وزن کل: ${fmtPersian(pallet.totalWeight, 0)} kg (کالا: ${fmtPersian(pallet.cargoWeight, 0)} kg + پالت: ${fmtPersian(pallet.tareWeight, 0)} kg)`,
            location: `موقعیت: x=${toPersianDigits(pallet.posX)}cm, y=${toPersianDigits(pallet.posY)}cm`
          }
        });
        globalBoxIndex++;
      });
    }

    // B. DIRECT CARGO LOADING MODE (Radiators arranged in lanes & layers)
    if (packed && packed.length > 0) {
      const laneWidth = tW / (lanesCount || 3);
      const layerH = 11 * sc; // 11cm layer height scaled

      packed.forEach((layer, layerIdx) => {
        if (!layer.lanes || layer.lanes.length === 0) return;

        const layerGroup = new THREE.Group();
        const layerY = layerIdx * layerH;
        layerGroup.position.set(0, layerY, 0);
        cargoGroup.add(layerGroup);
        layerGroupsRef.current.push(layerGroup);

        layer.lanes.forEach((lane, laneIdx) => {
          if (!lane.list || lane.list.length === 0) return;

          let currentX = 0;
          const laneZ = laneIdx * laneWidth + laneWidth / 2;

          lane.list.forEach((itemLen, itemIdx) => {
            const packagedL = getPackagedLength(itemLen);
            const radL = packagedL * sc;
            const radW = laneWidth * 0.92;
            const radH = layerH * 0.9;

            const radX = currentX + radL / 2;

            // Grouping Color determination
            const groupInfo = GROUP_COLORS[laneIdx % GROUP_COLORS.length];
            const baseColorHex = colorMode === 'size'
              ? (SIZE_HEX_COLORS[itemLen] || DEFAULT_HEX_COLOR)
              : colorMode === 'group'
              ? groupInfo.hex
              : 0xf1f5f9;

            // Printed Label Texture on Box Top
            const labelCode = `Num ${itemLen}-${groupInfo.badge}`;
            const subCode = `${toPersianDigits(itemLen)}cm (${toPersianDigits(packagedL)}cm) | ${fmtPersian(pieceWeight(itemLen), 1)}kg`;
            const boxTexture = createBoxLabelTexture(labelCode, subCode, baseColorHex);

            const radGeo = new THREE.BoxGeometry(radL, radH, radW);
            const topMat = new THREE.MeshStandardMaterial({ map: boxTexture, roughness: 0.35 });
            const sideMat = new THREE.MeshStandardMaterial({
              color: baseColorHex,
              roughness: 0.3,
              metalness: 0.2
            });

            // Apply texture to top face (index 2)
            const boxMaterials = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
            const radMesh = new THREE.Mesh(radGeo, boxMaterials);
            radMesh.position.set(radX, radH / 2 + 0.5, laneZ);
            radMesh.castShadow = true;
            radMesh.receiveShadow = true;
            layerGroup.add(radMesh);
            boxMeshesRef.current.push(radMesh);

            // Black/Dark Outline Edges around each radiator box
            const edgesGeo = new THREE.EdgesGeometry(radGeo);
            const edgesMat = new THREE.LineBasicMaterial({
              color: colorMode === 'size' ? 0x0f172a : 0x334155,
              linewidth: 1.5
            });
            const edgesSeg = new THREE.LineSegments(edgesGeo, edgesMat);
            edgesSeg.position.set(radX, radH / 2 + 0.5, laneZ);
            layerGroup.add(edgesSeg);

            // Top Fin Texture Stripes
            const finGeo = new THREE.BoxGeometry(radL * 0.88, 0.2, radW * 0.8);
            const finMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
            const finMesh = new THREE.Mesh(finGeo, finMat);
            finMesh.position.set(radX, radH + 0.5, laneZ);
            layerGroup.add(finMesh);

            // Register for Raycasting Interaction
            const itemW = pieceWeight(itemLen);
            interactiveMeshesRef.current.push({
              mesh: radMesh,
              index: globalBoxIndex,
              data: {
                title: `رادیاتور پنلی ${toPersianDigits(itemLen)} سانتی‌متری (${groupInfo.badge})`,
                details: `لایه ${toPersianDigits(layerIdx + 1)} | ردیف ${toPersianDigits(laneIdx + 1)} | جایگاه ${toPersianDigits(itemIdx + 1)}`,
                weight: `${fmtPersian(itemW, 1)} kg`,
                location: `طول از کانتینر: ${toPersianDigits(Math.round(currentX / sc))} تا ${toPersianDigits(Math.round((currentX + radL) / sc))} cm`
              }
            });

            currentX += radL;
            globalBoxIndex++;
          });
        });
      });
    }

    // Add 3D Center of Gravity (CoG) marker mesh
    if (evalResult?.cogX !== undefined && evalResult?.cogY !== undefined) {
      const cogScX = (evalResult.cogX ?? 0) * sc - tL / 2;
      const cogScY = (evalResult.cogZ || 25) * sc;
      const cogScZ = (evalResult.cogY ?? 0) * sc - tW / 2;

      const cogGroup = new THREE.Group();
      cogGroup.name = 'cogGroup';

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
      outerSphereMesh.position.set(cogScX, cogScY, cogScZ);
      cogGroup.add(outerSphereMesh);

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

      cargoGroup.add(cogGroup);
    }

    // 10. Initial Camera Target Positioning
    setCameraPosition(viewPreset, camera, controls, tL, tW, tH);

    // 11. Animation Loop
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

    // 12. Mouse move handler for Raycasting Tooltips & Box Selection
    const domElem = renderer.domElement;
    const interactiveMeshes = interactiveMeshesRef.current.map((i) => i.mesh);
    let lastHoveredTitle: string | null = null;

    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseRef.current) return;
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
            setSelectedBoxIndex(found.index);
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

  // Update Layer Explode Spacing
  useEffect(() => {
    if (!layerGroupsRef.current || layerGroupsRef.current.length === 0) return;
    const layerH = 11 * 0.1;
    layerGroupsRef.current.forEach((group, idx) => {
      group.position.y = idx * (layerH + layerExplodeGap * 0.1);
    });
  }, [layerExplodeGap]);

  // Helper to set Camera Preset positions
  const setCameraPosition = (
    preset: 'iso' | 'top' | 'side' | 'rear' | 'axle',
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
    } else if (preset === 'axle') {
      camera.position.set(-tL * 0.5, tH * 1.2, tL * 1.2);
    }
    controls.update();
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const factor = direction === 'in' ? 0.8 : 1.25;
    cameraRef.current.position.multiplyScalar(factor);
    controlsRef.current.update();
  };

  if (!ok || !truck) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 font-bold text-sm my-6">
        اطلاعات چیدمان ۳ بعدی در دسترس نیست.
      </div>
    );
  }

  const tL = (truck.L || 470) * 0.1;
  const tW = (truck.W || 220) * 0.1;
  const tH = 180 * 0.1;

  // Axle weight calculations for PIP overlay
  const frontAxle = Math.round(evalResult.frontAxleWeight || (evalResult.truck.cap * 0.35));
  const rearAxle = Math.round(evalResult.rearAxleWeight || (evalResult.truck.cap * 0.65));
  const axleLimit = evalResult.truck.cap || 10000;
  const isAxleOk = evalResult.axleOk ?? true;

  return (
    <div className={`bg-slate-950 text-white rounded-2xl border border-slate-800 p-4 md:p-6 shadow-xl my-6 transition-all ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto p-6 bg-slate-950' : ''
    }`}>
      {/* 3D Viewer Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-indigo-600/30 text-indigo-400 rounded-xl flex items-center justify-center font-bold border border-indigo-500/30">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              شبیه‌ساز سه‌بعدی چیدمان و بارگیری ({truck.name})
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                EasyCargo 3D Mode
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              چیدمان هوشمند با قابلیت کنترل تفکیک ایستگاهی، نمایش گام‌به‌گام و محاسبه وزن اکسل‌ها ({toPersianDigits(Math.round(evalResult.fill || 0))}٪ ظرفیت)
            </p>
          </div>
        </div>

        {/* Control Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Left Cargo Groups Drawer */}
          <button
            type="button"
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
              showLeftPanel
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="پنل گروه بار و ایستگاه‌ها"
          >
            {showLeftPanel ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
            <span>فهرست گروه‌ها</span>
          </button>

          {/* Camera Presets */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1">
            <button
              type="button"
              onClick={() => cameraRef.current && controlsRef.current && setCameraPosition('iso', cameraRef.current, controlsRef.current, tL, tW, tH)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                viewPreset === 'iso' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ایزومتریک
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current && controlsRef.current && setCameraPosition('top', cameraRef.current, controlsRef.current, tL, tW, tH)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                viewPreset === 'top' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              از بالا
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current && controlsRef.current && setCameraPosition('side', cameraRef.current, controlsRef.current, tL, tW, tH)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                viewPreset === 'side' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              جانبی
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current && controlsRef.current && setCameraPosition('rear', cameraRef.current, controlsRef.current, tL, tW, tH)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                viewPreset === 'rear' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              درب عقب
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current && controlsRef.current && setCameraPosition('axle', cameraRef.current, controlsRef.current, tL, tW, tH)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                viewPreset === 'axle' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:text-white'
              }`}
            >
              <Scale className="w-3 h-3" />
              اکسل‌ها
            </button>
          </div>

          {/* Color Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              if (colorMode === 'size') setColorMode('group');
              else if (colorMode === 'group') setColorMode('realistic');
              else setColorMode('size');
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            {colorMode === 'size' ? 'رنگ بر اساس طول' : colorMode === 'group' ? 'رنگ بر اساس گروه' : 'واقع‌گرایانه (سفید)'}
          </button>

          {/* Auto Rotation */}
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-xl text-xs font-bold transition border ${
              autoRotate ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="چرخش خودکار"
          >
            <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
          </button>

          {/* Zoom */}
          <button
            type="button"
            onClick={() => handleZoom('in')}
            className="p-2 bg-slate-900 text-slate-300 rounded-xl border border-slate-800 hover:bg-slate-800"
            title="بزرگ‌نمایی"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom('out')}
            className="p-2 bg-slate-900 text-slate-300 rounded-xl border border-slate-800 hover:bg-slate-800"
            title="کوچک‌نمایی"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30 hover:bg-indigo-600/50"
            title={isFullscreen ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Layer Explode Slider */}
      {usedLayers > 1 && (
        <div className="mb-4 p-3 bg-indigo-950/40 rounded-xl border border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-200">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>تفکیک و فاصله‌گذاری طبقات (Exploded View):</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={layerExplodeGap}
              onChange={(e) => setLayerExplodeGap(parseInt(e.target.value) || 0)}
              className="w-full sm:w-48 accent-indigo-500"
            />
            <span className="text-xs font-black font-mono text-indigo-300 min-w-[50px]">
              {toPersianDigits(layerExplodeGap)} cm
            </span>
          </div>
        </div>
      )}

      {/* MAIN 3D WORKSPACE LAYOUT (Side panel + 3D Canvas + PIP Insets) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative">
        
        {/* LEFT SIDEBAR: Cargo Groups & Stops Inspector Panel (EasyCargo Style) */}
        {showLeftPanel && (
          <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-3 max-h-[520px] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                گروه‌بندی بار و ایستگاه‌ها
              </span>
              <span className="text-[11px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-800">
                {toPersianDigits(totalItemsCount)} بسته
              </span>
            </div>

            {/* Selected Item 3D Mini Rotating Preview Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center relative overflow-hidden">
              <span className="text-[10px] text-slate-400 font-semibold block mb-1">پیش‌نمایش قطعه انتخاب‌شده</span>
              <div className="w-20 h-20 mx-auto my-1 flex items-center justify-center bg-slate-900 rounded-xl border border-indigo-500/30 shadow-inner relative">
                <Box className="w-10 h-10 text-indigo-400 animate-bounce" />
                <span className="absolute bottom-1 right-1 text-[9px] bg-indigo-600 text-white px-1 rounded font-bold">
                  {toPersianDigits(selectedBoxIndex + 1)}
                </span>
              </div>
              <div className="text-xs font-bold text-white mt-1">
                {hoveredInfo?.title || `رادیاتور ۱۰۰ سانتی‌متری`}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {hoveredInfo?.weight || `وزن: ۲۲ kg | لایه ۱`}
              </div>
            </div>

            {/* Groups List */}
            <div className="space-y-2">
              {GROUP_COLORS.map((group, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 ${group.bgClass} text-slate-950 font-black text-xs rounded-lg flex items-center justify-center shadow-xs`}>
                      {group.badge}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{group.name}</div>
                      <div className="text-[10px] text-slate-400">تعداد تقریبی: {toPersianDigits(Math.ceil(totalItemsCount / 4))} عدد</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    OK
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CENTRAL 3D CANVAS VIEWPORT */}
        <div className={`${showLeftPanel ? 'lg:col-span-9' : 'lg:col-span-12'} relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner min-h-[440px]`}>
          <div
            ref={isFullscreen ? modalMountRef : mountRef}
            className={`w-full ${isFullscreen ? 'h-[calc(100vh-220px)]' : 'h-[440px]'}`}
          />

          {/* Interactive Hover Tooltip Box */}
          {hoveredInfo && (
            <div className="absolute top-4 right-4 max-w-xs bg-slate-900/95 text-white p-3.5 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md animate-fadeIn pointer-events-none z-20">
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

          {/* Touch / Control Guide Overlay */}
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 pointer-events-none shadow-xs z-10">
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>چرخش کامل ۳۶۰ درجه | زوم دو انگشتی (Pinch Zoom)</span>
          </div>

          {/* PIP WINDOW 1: Selected Box Inspector PIP (Top-Right Overlay - EasyCargo Style) */}
          {showPIPViews && (
            <div className="absolute top-14 left-4 w-44 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 shadow-xl backdrop-blur-md hidden sm:block z-10">
              <div className="flex items-center justify-between mb-1.5 border-b border-slate-800 pb-1">
                <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
                  <RotateCw className="w-3 h-3 text-indigo-400" />
                  جهت چیدمان و چرخش
                </span>
                <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1 rounded">3D Lens</span>
              </div>
              <div className="h-20 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-center relative overflow-hidden">
                <Box className="w-8 h-8 text-indigo-400" />
                {/* 3D Rotation Gizmo Handle indicator overlay */}
                <div className="absolute inset-0 border-2 border-dashed border-indigo-500/40 rounded-lg animate-pulse" />
                <div className="absolute bottom-1 right-1 text-[9px] font-mono text-slate-400">
                  90° ROT
                </div>
              </div>
              <div className="text-[10px] text-slate-300 mt-1.5 text-center font-mono">
                {toPersianDigits(selectedBoxIndex + 1)} / {toPersianDigits(totalItemsCount)}
              </div>
            </div>
          )}

          {/* PIP WINDOW 2: Axle Load Distribution Visual Diagram (Bottom Right PIP Overlay) */}
          {showPIPViews && (
            <div className="absolute bottom-14 left-4 w-52 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 shadow-xl backdrop-blur-md hidden md:block z-10">
              <div className="flex items-center justify-between mb-1.5 border-b border-slate-800 pb-1">
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  نمودار بارگیری اکسل‌ها
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${isAxleOk ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'}`}>
                  {isAxleOk ? 'متوازن' : 'نامتوازن'}
                </span>
              </div>

              {/* Truck Axle Schematic */}
              <div className="relative h-16 bg-slate-950 rounded-lg border border-slate-800 p-1 flex items-center justify-around">
                {/* Front Axle Indicator */}
                <div className="text-center">
                  <div className="text-[9px] text-slate-400">فرمان (جلو)</div>
                  <div className="text-xs font-bold text-emerald-400">{fmtPersian(frontAxle, 0)} kg</div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mx-auto mt-0.5 animate-ping" />
                </div>

                <div className="h-8 w-px bg-slate-800" />

                {/* Rear Axle Indicator */}
                <div className="text-center">
                  <div className="text-[9px] text-slate-400">دیفرانسیل (عقب)</div>
                  <div className="text-xs font-bold text-emerald-400">{fmtPersian(rearAxle, 0)} kg</div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mx-auto mt-0.5 animate-ping" />
                </div>
              </div>
            </div>
          )}

          {/* STEP-BY-STEP LOADING PLAYBACK TOOLBAR (Bottom Bar - EasyCargo Style) */}
          <div className="absolute bottom-3 right-3 left-3 bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2 shadow-lg z-20">
            {/* Playback Animation Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (currentStep <= 0) setCurrentStep(0);
                  setIsPlaying(!isPlaying);
                }}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
                title={isPlaying ? 'توقف شبیه‌سازی' : 'پخش شبیه‌سازی بارگیری'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                title="گام قبل"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(Math.min(totalItemsCount, currentStep + 1))}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                title="گام بعد"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-[11px] font-bold text-slate-300">گام بارگیری:</span>
                <span className="text-xs font-mono font-black text-indigo-400">
                  {toPersianDigits(currentStep)} / {toPersianDigits(totalItemsCount)}
                </span>
              </div>

              {/* Progress Bar */}
              <input
                type="range"
                min="0"
                max={totalItemsCount || 100}
                value={currentStep}
                onChange={(e) => setCurrentStep(parseInt(e.target.value) || 0)}
                className="w-24 sm:w-36 accent-indigo-500"
              />
            </div>

            {/* Color Legend & Info */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>طول مفید: <b>{toPersianDigits(truck.L)} cm</b></span>
              <span>|</span>
              <span>ارتفاع: <b>{toPersianDigits(usedLayers * 11)} cm</b></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Layout3DView.displayName = 'Layout3DView';
