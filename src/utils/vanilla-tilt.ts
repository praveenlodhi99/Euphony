class VanillaTilt {
  private width: number | null = null;
  private height: number | null = null;
  private clientWidth: number | null = null;
  private clientHeight: number | null = null;
  private left: number | null = null;
  private top: number | null = null;

  private gammazero: number | null = null;
  private betazero: number | null = null;
  private lastgammazero: number | null = null;
  private lastbetazero: number | null = null;

  private transitionTimeout: number | null = null;
  private updateCall: number | null = null;
  private event: MouseEvent | { clientX: number, clientY: number } | null = null;

  private updateBind: () => void;
  private resetBind: () => void;

  private elementListener: HTMLElement | Document;
  private reverse: number;
  private resetToStart: boolean;
  private glare: boolean;
  private glarePrerender: boolean;
  private fullPageListening: boolean;
  private gyroscope: boolean;
  private gyroscopeSamples: number;
  private glareElementWrapper: HTMLElement | null = null;
  private glareElement: HTMLElement | null = null;

  constructor(private element: HTMLElement, private settings: Record<string, any> = {}) {
    if (!(element instanceof HTMLElement)) {
      throw new Error(`Can't initialize VanillaTilt because ${element} is not a HTMLElement.`);
    }

    this.updateBind = this.update.bind(this);
    this.resetBind = this.reset.bind(this);

    this.settings = this.extendSettings(settings);

    this.reverse = this.settings.reverse ? -1 : 1;
    this.resetToStart = VanillaTilt.isSettingTrue(this.settings["reset-to-start"]);
    this.glare = VanillaTilt.isSettingTrue(this.settings.glare);
    this.glarePrerender = VanillaTilt.isSettingTrue(this.settings["glare-prerender"]);
    this.fullPageListening = VanillaTilt.isSettingTrue(this.settings["full-page-listening"]);
    this.gyroscope = VanillaTilt.isSettingTrue(this.settings.gyroscope);
    this.gyroscopeSamples = this.settings.gyroscopeSamples;

    this.elementListener = this.getElementListener();

    if (this.glare) {
      this.prepareGlare();
    }

    if (this.fullPageListening) {
      this.updateClientSize();
    }

    this.addEventListeners();
    this.reset();

    if (!this.resetToStart) {
      this.settings.startX = 0;
      this.settings.startY = 0;
    }
  }

  static isSettingTrue(setting: any): boolean {
    return setting === "" || setting === true || setting === 1;
  }

  private getElementListener(): HTMLElement | Document {
    if (this.fullPageListening) {
      return document;
    }

    if (typeof this.settings["mouse-event-element"] === "string") {
      const mouseEventElement = document.querySelector<HTMLElement>(this.settings["mouse-event-element"]);

      if (mouseEventElement) {
        return mouseEventElement;
      }
    }

    if (this.settings["mouse-event-element"] instanceof HTMLElement) {
      return this.settings["mouse-event-element"];
    }

    return this.element;
  }

  private addEventListeners(): void {
    this.elementListener.addEventListener("mouseenter", this.onMouseEnter.bind(this));
    this.elementListener.addEventListener("mouseleave", this.onMouseLeave.bind(this));
    this.elementListener.addEventListener("mousemove", this.onMouseMove.bind(this));

    if (this.glare || this.fullPageListening) {
      window.addEventListener("resize", this.onWindowResize.bind(this));
    }

    if (this.gyroscope) {
      window.addEventListener("deviceorientation", this.onDeviceOrientation.bind(this));
    }
  }

  private removeEventListeners(): void {
    this.elementListener.removeEventListener("mouseenter", this.onMouseEnter.bind(this));
    this.elementListener.removeEventListener("mouseleave", this.onMouseLeave.bind(this));
    this.elementListener.removeEventListener("mousemove", this.onMouseMove.bind(this));

    if (this.gyroscope) {
      window.removeEventListener("deviceorientation", this.onDeviceOrientation.bind(this));
    }

    if (this.glare || this.fullPageListening) {
      window.removeEventListener("resize", this.onWindowResize.bind(this));
    }
  }

  destroy(): void {
    if (this.transitionTimeout !== null) {
      clearTimeout(this.transitionTimeout);
    }
    if (this.updateCall !== null) {
      cancelAnimationFrame(this.updateCall);
    }

    this.element.style.willChange = "";
    this.element.style.transition = "";
    this.element.style.transform = "";
    this.resetGlare();

    this.removeEventListeners();
    delete this.element.vanillaTilt;

    this.element = null as any;
  }

  private onDeviceOrientation(event: DeviceOrientationEvent): void {
    if (event.gamma === null || event.beta === null) {
      return;
    }

    this.updateElementPosition();

    if (this.gyroscopeSamples > 0) {
      this.lastgammazero = this.gammazero;
      this.lastbetazero = this.betazero;

      if (this.gammazero === null) {
        this.gammazero = event.gamma;
        this.betazero = event.beta;
      } else {
        this.gammazero = (event.gamma + this.lastgammazero) / 2;
        this.betazero = (event.beta + this.lastbetazero) / 2;
      }

      this.gyroscopeSamples -= 1;
    }

    const totalAngleX = this.settings.gyroscopeMaxAngleX - this.settings.gyroscopeMinAngleX;
    const totalAngleY = this.settings.gyroscopeMaxAngleY - this.settings.gyroscopeMinAngleY;

    const degreesPerPixelX = totalAngleX / this.width!;
    const degreesPerPixelY = totalAngleY / this.height!;

    const angleX = event.gamma - (this.settings.gyroscopeMinAngleX + this.gammazero!);
    const angleY = event.beta - (this.settings.gyroscopeMinAngleY + this.betazero!);

    const posX = angleX / degreesPerPixelX;
    const posY = angleY / degreesPerPixelY;

    if (this.updateCall !== null) {
      cancelAnimationFrame(this.updateCall);
    }

    this.event = {
      clientX: posX + this.left!,
      clientY: posY + this.top!,
    };

    this.updateCall = requestAnimationFrame(this.updateBind);
  }

  private onMouseEnter(): void {
    this.updateElementPosition();
    this.element.style.willChange = "transform";
    this.setTransition();
  }

  private onMouseMove(event: MouseEvent): void {
    if (this.updateCall !== null) {
      cancelAnimationFrame(this.updateCall);
    }

    this.event = event;
    this.updateCall = requestAnimationFrame(this.updateBind);
  }

  private onMouseLeave(): void {
    this.setTransition();

    if (this.settings.reset) {
      requestAnimationFrame(this.resetBind);
    }
  }

  private reset(): void {
    this.onMouseEnter();

    if (this.fullPageListening) {
      this.event = {
        clientX: (this.settings.startX + this.settings.max) / (2 * this.settings.max) * this.clientWidth!,
        clientY: (this.settings.startY + this.settings.max) / (2 * this.settings.max) * this.clientHeight!
      };
    } else {
      this.event = {
        clientX: this.left! + ((this.settings.startX + this.settings.max) / (2 * this.settings.max) * this.width!),
        clientY: this.top! + ((this.settings.startY + this.settings.max) / (2 * this.settings.max) * this.height!)
      };
    }

    let backupScale = this.settings.scale;
    this.settings.scale = 1;
    this.update();
    this.settings.scale = backupScale;
    this.resetGlare();
  }

  private resetGlare(): void {
    if (this.glare) {
      this.glareElement!.style.transform = "rotate(180deg) translate(-50%, -50%)";
      this.glareElement!.style.opacity = "0";
    }
  }

  private getValues(): {
    tiltX: string;
    tiltY: string;
    percentageX: number;
    percentageY: number;
    angle: number;
  } {
    let x, y;

    if (this.fullPageListening) {
      x = this.event!.clientX / this.clientWidth!;
      y = this.event!.clientY / this.clientHeight!;
    } else {
      x = (this.event!.clientX - this.left!) / this.width!;
      y = (this.event!.clientY - this.top!) / this.height!;
    }

    x = Math.min(Math.max(x, 0), 1);
    y = Math.min(Math.max(y, 0), 1);

    const tiltX = (this.reverse * (this.settings.max - x * this.settings.max * 2)).toFixed(2);
    const tiltY = (this.reverse * (y * this.settings.max * 2 - this.settings.max)).toFixed(2);
    const angle = Math.atan2(this.event!.clientX - (this.left! + this.width! / 2), -(this.event!.clientY - (this.top! + this.height! / 2))) * (180 / Math.PI);

    return {
      tiltX,
      tiltY,
      percentageX: x * 100,
      percentageY: y * 100,
      angle
    };
  }

  private updateElementPosition(): void {
    const rect = this.element.getBoundingClientRect();
    this.width = this.element.offsetWidth;
    this.height = this.element.offsetHeight;
    this.left = rect.left;
    this.top = rect.top;
  }

  private update(): void {
    const values = this.getValues();

    this.element.style.transform = `perspective(${this.settings.perspective}px) ` +
      `rotateX(${this.settings.axis === "x" ? 0 : values.tiltY}deg) ` +
      `rotateY(${this.settings.axis === "y" ? 0 : values.tiltX}deg) ` +
      `scale3d(${this.settings.scale}, ${this.settings.scale}, ${this.settings.scale})`;

    if (this.glare) {
      this.glareElement!.style.transform = `rotate(${values.angle}deg) translate(-50%, -50%)`;
      this.glareElement!.style.opacity = `${(values.percentageY * this.settings["max-glare"] / 100).toFixed(2)}`;
    }

    this.element.dispatchEvent(new CustomEvent("tiltChange", {
      detail: values
    }));

    this.updateCall = null;
  }

  private prepareGlare(): void {
    if (!this.glarePrerender) {
      const jsTiltGlare = document.createElement("div");
      jsTiltGlare.classList.add("js-tilt-glare");

      const jsTiltGlareInner = document.createElement("div");
      jsTiltGlareInner.classList.add("js-tilt-glare-inner");

      jsTiltGlare.appendChild(jsTiltGlareInner);
      this.element.appendChild(jsTiltGlare);
    }

    this.glareElementWrapper = this.element.querySelector<HTMLElement>(".js-tilt-glare")!;
    this.glareElement = this.element.querySelector<HTMLElement>(".js-tilt-glare-inner")!;

    if (this.glarePrerender) {
      return;
    }

    Object.assign(this.glareElementWrapper.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      "pointer-events": "none"
    });

    Object.assign(this.glareElement.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      "pointer-events": "none",
      "background-image": `linear-gradient(0deg, rgba(255,255,255,${this.settings["glare-opacity"]}) 0%, rgba(255,255,255,0) 100%)`,
      width: `${this.element.offsetWidth * 2}px`,
      height: `${this.element.offsetWidth * 2}px`,
      transform: "rotate(180deg) translate(-50%, -50%)",
      "transform-origin": "0% 0%",
      opacity: "0",
    });
  }

  private updateClientSize(): void {
    this.clientWidth = window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth;

    this.clientHeight = window.innerHeight
      || document.documentElement.clientHeight
      || document.body.clientHeight;
  }

  private onWindowResize(): void {
    this.updateGlareSize();
    this.updateClientSize();
  }

  private updateGlareSize(): void {
    if (this.glare) {
      Object.assign(this.glareElement!.style, {
        width: `${this.element.offsetWidth * 2}`,
        height: `${this.element.offsetWidth * 2}`,
      });
    }
  }

  private setTransition(): void {
    clearTimeout(this.transitionTimeout!);
    this.element.style.transition = this.settings.speed + "ms " + this.settings.easing;

    if (this.glare) {
      this.glareElement!.style.transition = `opacity ${this.settings.speed}ms ${this.settings.easing}`;
    }

    this.transitionTimeout = window.setTimeout(() => {
      this.element.style.transition = "";
      if (this.glare) {
        this.glareElement!.style.transition = "";
      }
    }, this.settings.speed);
  }

  private extendSettings(settings: Record<string, any>): Record<string, any> {
    const defaultSettings = {
      reverse: false,
      max: 15,
      startX: 0,
      startY: 0,
      perspective: 1000,
      easing: "cubic-bezier(.03,.98,.52,.99)",
      scale: 1,
      speed: 300,
      transition: true,
      axis: null,
      glare: false,
      "max-glare": 1,
      "glare-prerender": false,
      "full-page-listening": false,
      "mouse-event-element": null,
      reset: true,
      "reset-to-start": true,
      gyroscope: true,
      gyroscopeMinAngleX: -45,
      gyroscopeMaxAngleX: 45,
      gyroscopeMinAngleY: -45,
      gyroscopeMaxAngleY: 45,
      gyroscopeSamples: 10
    };

    const newSettings: Record<string, any> = {};
    for (const property in defaultSettings) {
      if (property in settings) {
        newSettings[property] = settings[property];
      } else if (this.element.hasAttribute("data-tilt-" + property)) {
        const attribute = this.element.getAttribute("data-tilt-" + property);
        try {
          newSettings[property] = JSON.parse(attribute!);
        } catch (e) {
          newSettings[property] = attribute;
        }
      } else {
        newSettings[property] = defaultSettings[property];
      }
    }
    return newSettings;
  }

  static init(elements: HTMLElement | NodeListOf<HTMLElement>, settings?: Record<string, any>): void {
    if (elements instanceof HTMLElement) {
      elements = [elements] as any;
    }

    if (elements instanceof NodeList) {
      Array.from(elements).forEach((element: HTMLElement) => {
        if (!("vanillaTilt" in element)) {
          element.vanillaTilt = new VanillaTilt(element, settings);
        }
      });
    }
  }
}

export default VanillaTilt;
