export class Container {
  static instances: Container[];
  static pageSnapshot: any;
  static isCapturing: boolean;
  static waitingForSnapshot: Container[];

  element: HTMLElement;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  borderRadius: number;
  type: "rounded" | "circle" | "pill";
  tintOpacity: number;

  constructor(options?: {
    borderRadius?: number;
    type?: "rounded" | "circle" | "pill";
    tintOpacity?: number;
  });

  addChild(child: any): any;
  removeChild(child: any): void;
  updateSizeFromDOM(): void;
}

export class Button extends Container {}

export default Container;
