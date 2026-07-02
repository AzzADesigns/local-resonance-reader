"use client";

import {
  init as coreInit,
  metaData,
  imageLoader,
  volumeLoader,
  cornerstoneStreamingImageVolumeLoader,
} from "@cornerstonejs/core";
import dicomImageLoader from "@cornerstonejs/dicom-image-loader";
import { init as toolsInit } from "@cornerstonejs/tools";

let initialized = false;
let initPromise: Promise<void> | null = null;

export async function initCornerstone(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Pre-import jpeg-lossless-decoder-js so it's cached before decoding starts
    try {
      // @ts-ignore
      await import("jpeg-lossless-decoder-js");
      console.log("[INIT] jpeg-lossless-decoder-js pre-loaded OK");
    } catch (e) {
      console.warn("[INIT] Failed to pre-load jpeg-lossless-decoder-js:", e);
    }

    // Configure dicom-image-loader (workers handled by Cornerstone's WebWorkerManager)
    dicomImageLoader.init({
      maxWebWorkers: 1,
    });

    // Link Cornerstone core to dicom-image-loader
    const loader = dicomImageLoader as any;
    if (!loader.external) {
      loader.external = {};
    }
    loader.external.cornerstone = { metaData };

    await coreInit();
    await toolsInit();

    // Register WADO-URI and WADO-RS image loaders
    imageLoader.registerImageLoader(
      "wadouri",
      dicomImageLoader.wadouri.loadImage
    );
    imageLoader.registerImageLoader(
      "wadors",
      dicomImageLoader.wadors.loadImage
    );

    // Register the Cornerstone streaming volume loader (required for MPR)
    volumeLoader.registerUnknownVolumeLoader(
      cornerstoneStreamingImageVolumeLoader as any
    );
    volumeLoader.registerVolumeLoader(
      "cornerstoneStreamingImageVolume",
      cornerstoneStreamingImageVolumeLoader as any
    );

    // Register the metadata provider from dicom-image-loader
    metaData.addProvider(
      ((type: string, imageId: string) => {
        try {
          const provider = (dicomImageLoader as any).wadouri.metaData.metaDataProvider;
          if (provider) {
            const data = provider(type, imageId);
            if (data !== undefined) return data;
          }
        } catch (_) {}

        try {
          return (dicomImageLoader as any).wadors.metaDataManager.get(type, imageId);
        } catch (_) {
          return undefined;
        }
      }) as any,
      9999
    );

    initialized = true;
    console.log("[INIT] Cornerstone initialized — stack + MPR ready");
  })();

  return initPromise;
}
