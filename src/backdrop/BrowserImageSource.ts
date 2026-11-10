import type { ImageSource } from "./FrameLoader";

/** Loads frames through `Image`, resolving only once the bitmap is decoded. */
export class BrowserImageSource implements ImageSource<HTMLImageElement> {
  public load(url: string): Promise<HTMLImageElement> {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    return image.decode().then(() => image);
  }
}
