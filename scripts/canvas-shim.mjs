// Pure-JS canvas shim — replaces the native 'canvas' addon
// Only implements what mind-ar's OfflineCompiler needs:
//   createCanvas(w, h) → { getContext('2d') → { drawImage, getImageData } }
export function createCanvas(w, h) {
  const buf = new Uint8ClampedArray(w * h * 4);
  return {
    width: w,
    height: h,
    getContext() {
      return {
        drawImage(img) {
          // img._rgba set by our PNG decoder
          if (img && img._rgba) buf.set(img._rgba.subarray(0, buf.length));
        },
        getImageData() {
          return { data: buf };
        },
      };
    },
  };
}
