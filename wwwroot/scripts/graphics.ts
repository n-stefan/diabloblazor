
interface Image {
    x: number;
    y: number;
    width: number;
    height: number;
    data: number;
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

    public initGraphics = (offscreen: boolean): void => {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        this.context = offscreen ? canvas.getContext('bitmaprenderer') : canvas.getContext('2d', { alpha: false });
    }

    public onRender = (renderBatch: RenderBatch): void => {
        if (this.context instanceof ImageBitmapRenderingContext)
            this.context.transferFromImageBitmap(renderBatch.bitmap);
        else if (this.context instanceof CanvasRenderingContext2D) {
            const ctx = this.context;
            for (const i of renderBatch.images) {
                const image = ctx.createImageData(i.width, i.height);
                const data = windowAny.Blazor.runtime.localHeapViewU8().subarray(i.data, i.data + (i.width * i.height * 4));
                image.data.set(data);
                ctx.putImageData(image, i.x, i.y);
            }
            if (renderBatch.text.length) {
                ctx.save();
                ctx.font = 'bold 13px Times New Roman';
                if (renderBatch.clip) {
                    const c = renderBatch.clip;
                    ctx.beginPath();
                    ctx.rect(c.x0, c.y0, c.x1 - c.x0, c.y1 - c.y0);
                    ctx.clip();
                }
                for (const t of renderBatch.text) {
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
