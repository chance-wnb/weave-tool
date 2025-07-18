import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface MatrixVisualizationProps {
  width?: number;
  height?: number;
  onTransformComplete?: () => void;
}

interface MatrixChar {
  char: string;
  x: number;
  y: number;
  z: number;
  speed: number;
  opacity: number;
  scale: number;
  targetX?: number;
  targetY?: number;
  isTransforming?: boolean;
  transformProgress?: number;
}

const MatrixVisualization: React.FC<MatrixVisualizationProps> = ({ 
  width = 800, 
  height = 600, 
  onTransformComplete 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const animationRef = useRef<number>();
  const matrixCharsRef = useRef<MatrixChar[]>([]);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const [isTransforming, setIsTransforming] = useState(false);

  // Terminal characters that will fall
  const terminalChars = [
    // Command characters
    'l', 's', '-', 'l', 'a', ' ', 'p', 's', ' ', 'a', 'u', 'x', ' ',
    'g', 'r', 'e', 'p', ' ', 'c', 'a', 't', ' ', 't', 'a', 'i', 'l',
    // Table characters
    '│', '┌', '┐', '└', '┘', '├', '┤', '┬', '┴', '┼', '─', '═', '║',
    // Data characters
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    '.', '/', '\\', '|', '%', '@', '#', '*', '+', '=',
    // System info
    'C', 'P', 'U', 'M', 'E', 'M', 'D', 'I', 'S', 'K'
  ];

  // Table structure that characters will form
  const tableStructure = [
    '┌──────────────┬──────────┬──────────┐',
    '│ Command      │ Status   │ Duration │',
    '├──────────────┼──────────┼──────────┤',
    '│ ls -la       │ Success  │ 0.12s    │',
    '│ ps aux       │ Success  │ 0.34s    │',
    '│ grep data    │ Success  │ 0.08s    │',
    '│ cat logs     │ Success  │ 0.45s    │',
    '└──────────────┴──────────┴──────────┘'
  ];

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 50;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    rendererRef.current = renderer;

    // Clear any existing content
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Initialize matrix characters
    initializeMatrixChars();

    // Start animation
    animate();

    // Start transformation after 3 seconds
    setTimeout(() => {
      startTransformation();
    }, 3000);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [width, height]);

  const initializeMatrixChars = () => {
    const chars: MatrixChar[] = [];
    const meshes: THREE.Mesh[] = [];
    
    // Create falling characters
    for (let i = 0; i < 200; i++) {
      const char = terminalChars[Math.floor(Math.random() * terminalChars.length)];
      
      // Create text geometry
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 64;
      canvas.height = 64;
      
      context.fillStyle = '#00ff00';
      context.font = '32px "Courier New", monospace';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(char, 32, 32);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({ 
        map: texture, 
        transparent: true,
        opacity: Math.random() * 0.8 + 0.2
      });
      
      const geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position randomly
      const x = (Math.random() - 0.5) * 80;
      const y = Math.random() * 60 + 30;
      const z = (Math.random() - 0.5) * 20;
      
      mesh.position.set(x, y, z);
      
      chars.push({
        char,
        x,
        y,
        z,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.8 + 0.2,
        scale: Math.random() * 0.5 + 0.5,
        isTransforming: false,
        transformProgress: 0
      });
      
      meshes.push(mesh);
      sceneRef.current?.add(mesh);
    }
    
    matrixCharsRef.current = chars;
    meshesRef.current = meshes;
  };

  const startTransformation = () => {
    setIsTransforming(true);
    
    // Calculate target positions for table structure
    const tableTargets: { x: number; y: number; char: string }[] = [];
    
    tableStructure.forEach((row, rowIndex) => {
      const y = 15 - rowIndex * 4; // Vertical spacing
      [...row].forEach((char, colIndex) => {
        const x = -35 + colIndex * 2; // Horizontal spacing
        tableTargets.push({ x, y, char });
      });
    });
    
    // Assign targets to closest characters
    matrixCharsRef.current.forEach((matrixChar, index) => {
      if (index < tableTargets.length) {
        const target = tableTargets[index];
        matrixChar.targetX = target.x;
        matrixChar.targetY = target.y;
        matrixChar.isTransforming = true;
        matrixChar.transformProgress = 0;
        
        // Update the character
        matrixChar.char = target.char;
        
        // Update the mesh texture
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = 64;
        canvas.height = 64;
        
        context.fillStyle = '#00ff00';
        context.font = '32px "Courier New", monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(target.char, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = meshesRef.current[index].material as THREE.MeshBasicMaterial;
        material.map = texture;
        material.needsUpdate = true;
      }
    });
    
    // Complete transformation after animation
    setTimeout(() => {
      onTransformComplete?.();
    }, 4000);
  };

  const animate = () => {
    animationRef.current = requestAnimationFrame(animate);
    
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;
    
    // Update matrix characters
    matrixCharsRef.current.forEach((char, index) => {
      const mesh = meshesRef.current[index];
      if (!mesh) return;
      
      if (char.isTransforming && char.targetX !== undefined && char.targetY !== undefined) {
        // Transform to table position
        char.transformProgress = Math.min(char.transformProgress + 0.02, 1);
        
        const progress = char.transformProgress;
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        
        char.x = char.x + (char.targetX - char.x) * easeProgress * 0.1;
        char.y = char.y + (char.targetY - char.y) * easeProgress * 0.1;
        char.z = char.z + (0 - char.z) * easeProgress * 0.1;
        
        // Update material opacity
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.opacity = Math.min(1, char.opacity + progress * 0.3);
        
        // Change color during transformation
        if (progress > 0.7) {
          material.color.setHex(0x00ffff); // Cyan for table
        }
        
      } else {
        // Matrix rain effect
        char.y -= char.speed;
        if (char.y < -30) {
          char.y = 30;
          char.x = (Math.random() - 0.5) * 80;
        }
        
        // Flickering opacity
        char.opacity = Math.sin(Date.now() * 0.01 + index) * 0.3 + 0.7;
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.opacity = char.opacity;
      }
      
      mesh.position.set(char.x, char.y, char.z);
    });
    
    // Subtle camera movement
    if (cameraRef.current) {
      cameraRef.current.position.x = Math.sin(Date.now() * 0.001) * 5;
      cameraRef.current.position.y = Math.cos(Date.now() * 0.0008) * 3;
      cameraRef.current.lookAt(0, 0, 0);
    }
    
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  return (
    <div className="relative">
      <div ref={mountRef} className="w-full h-full" />
      {isTransforming && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-green-400 text-xl font-mono animate-pulse">
            WEAVE TOOL: TRANSFORMING DATA...
          </div>
        </div>
      )}
    </div>
  );
};

export default MatrixVisualization;