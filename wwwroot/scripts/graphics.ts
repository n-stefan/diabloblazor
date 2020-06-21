
interface Image {
    buffer?: ArrayBuffer;
    x: number;
    y: number;
    width: number;
    height: number;
    data: Uint8Array;
}

interface TextDef {
    x: number;
    y: number;
    text: string;
    color: number;
}

interface Clip {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

interface RenderBatch {
    bitmap?: ImageBitmap;    
    images: Image[];
    text: TextDef[];
    clip: Clip;
}

type RenderContext = CanvasRenderingContext2D | ImageBitmapRenderingContext;

class Graphics {
    private context: RenderContext;
    private renderBatch: RenderBatch;

    constructor() {
        windowAny.DApi.draw_begin = this.drawBegin;
        windowAny.DApi.draw_end = this.drawEnd;
        windowAny.DApi.draw_blit = this.drawBlit;
        windowAny.DApi.draw_clip_text = this.drawClipText;
        windowAny.DApi.draw_text = this.drawText;
        windowAny.DApi.draw_belt = this.drawBelt;
    }

    public initGraphics = (offscreen: boolean): void => {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        this.context = (offscreen) ? canvas.getContext('bitmaprenderer') : canvas.getContext('2d', { alpha: false });
    }

    public drawBegin = (): void => {
        this.renderBatch = {
            images: [],
            text: [],
            clip: null
        };
    }

    //private frameTime: number = 0;
    //private lastTime: number = 0;

    //private getFPS = (): number => {
    //    const time = performance.now();
    //    if (!this.lastTime)
    //        this.lastTime = time;
    //    this.frameTime = time - this.lastTime; //0.9 * this.frameTime + 0.1 * (time - this.lastTime);
    //    this.lastTime = time;
    //    return this.frameTime ? 1000.0 / this.frameTime : 0.0;
    //}

    public drawEnd = (): void => {
        //this.drawText(2, 10, `FPS: ${this.getFPS().toFixed(1)}`, 0x7070FF);
        this.onRender();
        this.renderBatch = null;
    }

    public drawBlit = (x: number, y: number, width: number, height: number, data: Uint8Array): void => {
        this.renderBatch.images.push({ x, y, width, height, data: data.slice() });
    }

    public drawClipText = (x0: number, y0: number, x1: number, y1: number): void => {
        this.renderBatch.clip = { x0, y0, x1, y1 };
    }

    public drawText = (x: number, y: number, text: string, color: number): void => {
        this.renderBatch.text.push({ x, y, text, color });
    }

    public drawBelt = (items: Uint8Array): void => {
        //Do nothing
    }

    private onRender = (): void => {
        if (this.context instanceof ImageBitmapRenderingContext) //(renderBatch.bitmap)
            (this.context as ImageBitmapRenderingContext).transferFromImageBitmap(this.renderBatch.bitmap);
        else if (this.context instanceof CanvasRenderingContext2D) {
            const ctx = this.context as CanvasRenderingContext2D;
            for (let i of this.renderBatch.images) {
                const image = ctx.createImageData(i.width, i.height);
                image.data.set(i.data);
                ctx.putImageData(image, i.x, i.y);
            }
            if (this.renderBatch.text.length) {
                ctx.save();
                ctx.font = 'bold 13px Times New Roman';
                if (this.renderBatch.clip) {
                    const c = this.renderBatch.clip;
                    ctx.beginPath();
                    ctx.rect(c.x0, c.y0, c.x1 - c.x0, c.y1 - c.y0);
                    ctx.clip();
                }
                for (let t of this.renderBatch.text) {
                    const r = ((t.color >> 16) & 0xFF);
                    const g = ((t.color >> 8) & 0xFF);
                    const b = (t.color & 0xFF);
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    ctx.fillText(t.text, t.x, t.y /* + 22*/);
                }
                ctx.restore();
            }
        }
    }
}
