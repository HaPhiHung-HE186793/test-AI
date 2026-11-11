#!/usr/bin/env node
/**
 * 100% Native Google Flow SceneBuilder Exporter (ZERO ffmpeg post-production)
 *
 * Invokes Google Flow's built-in SceneBuilder `download()` method (`GjQLTd` + `IxdSwd`
 * cloud export RPCs on `window.__flowSB`) and captures the resulting `video/mp4` Blob
 * directly from `URL.createObjectURL` without any ffmpeg crop/zoom/blur/concat/HUD.
 */
import fs from 'node:fs';
import { evalInFlowPage } from '../../../../flow-scenebuilder-client.mjs';

export async function exportNativeSceneFromFlow({ clipSpecs, outputPath }) {
  const b64 = await evalInFlowPage(`(async () => {
    const sb = window.__flowSB;
    if (!sb || sb.Ca?.Va) throw new Error("Active SceneBuilder instance (__flowSB) not found on page");
    const origGc = sb.Gc;
    const origCreateObjectURL = URL.createObjectURL;
    const origClick = HTMLAnchorElement.prototype.click;
    let capturedBlob = null;

    if (${JSON.stringify(clipSpecs || null)}) {
      const specs = ${JSON.stringify(clipSpecs || null)};
      sb.Gc = () => specs.map((s, idx) => ({
        idx,
        workflowId: s.workflowId || "",
        primaryMediaId: s.primaryMediaId,
        Wg: s.Wg ?? 0,
        Rg: s.Rg ?? s.Yb,
        Yb: s.Yb ?? s.Rg
      }));
    }

    URL.createObjectURL = function(obj) {
      if (obj instanceof Blob) {
        capturedBlob = obj;
      }
      return origCreateObjectURL.apply(this, arguments);
    };
    HTMLAnchorElement.prototype.click = function() {
      // Suppress browser file dialog during automated cloud export capture
    };

    try {
      sb.eI?.set?.(false);
      await sb.download();
    } finally {
      sb.Gc = origGc;
      URL.createObjectURL = origCreateObjectURL;
      HTMLAnchorElement.prototype.click = origClick;
    }

    if (!capturedBlob) throw new Error("Native SceneBuilder download() did not produce a Blob");
    const buf = await capturedBlob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  })()`);

  if (!b64 || typeof b64 !== 'string') {
    throw new Error(`Failed to export native scene from Flow: ${JSON.stringify(b64)}`);
  }
  const buf = Buffer.from(b64, 'base64');
  fs.writeFileSync(outputPath, buf);
  console.log(`Saved 100% Native Google Flow SceneBuilder MP4 (${buf.length} bytes) -> ${outputPath}`);
  return outputPath;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = process.argv[2] || 'native_scenebuilder_export.mp4';
  const specsJson = process.argv[3] ? JSON.parse(process.argv[3]) : null;
  exportNativeSceneFromFlow({ clipSpecs: specsJson, outputPath: out }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
