import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { SkinViewer, OrbitControls } from 'skinview3d';

/**
 * Reusable 3D Minecraft Skin/Cape Preview Component
 * Props:
 * - skinUrl (string): URL or base64 data URL for the skin
 * - capeUrl (string): URL or base64 data URL for the cape
 * - model (string): "classic" (4px arms) or "slim" (3px arms)
 * - width (number): Canvas width
 * - height (number): Canvas height
 * - autoRotate (boolean): Enable auto rotation
 * - controls (boolean): Enable mouse drag orbit controls
 * - onReady (function): Callback when viewer is initialized, passing the viewer instance
 */
export const SkinPreview3D = forwardRef(({
  skinUrl,
  capeUrl,
  model = 'classic',
  width = 300,
  height = 400,
  autoRotate = false,
  controls = false,
  onReady
}, ref) => {
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getViewer: () => viewerRef.current,
    getCanvas: () => canvasRef.current,
    // Helper to force a render for screenshotting (WebGL preserveDrawingBuffer issue)
    forceRender: () => {
      if (viewerRef.current) {
        viewerRef.current.renderer.render(viewerRef.current.scene, viewerRef.current.camera);
      }
    }
  }));

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize viewer
    const viewer = new SkinViewer({
      canvas: canvasRef.current,
      width,
      height,
      skin: skinUrl || undefined,
      cape: capeUrl || undefined,
      model,
      preserveDrawingBuffer: true
    });

    viewerRef.current = viewer;

    if (autoRotate) {
      viewer.autoRotate = true;
      viewer.autoRotateSpeed = 0.5;
    }

    if (controls) {
      new OrbitControls(viewer);
    }

    if (onReady) {
      onReady(viewer);
    }

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, []); // Run once on mount

  // Handle skin/cape/model updates
  useEffect(() => {
    if (!viewerRef.current) return;
    
    if (skinUrl) {
      viewerRef.current.loadSkin(skinUrl, model);
    } else {
      viewerRef.current.resetSkin();
    }
  }, [skinUrl, model]);

  useEffect(() => {
    if (!viewerRef.current) return;
    
    if (capeUrl) {
      viewerRef.current.loadCape(capeUrl);
    } else {
      viewerRef.current.resetCape();
    }
  }, [capeUrl]);

  return (
    <canvas ref={canvasRef} style={{ width, height, maxWidth: '100%' }} />
  );
});

SkinPreview3D.displayName = 'SkinPreview3D';
