
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

    public render = (renderBatch: RenderBatch): void => {
        if (this.context instanceof ImageBitmapRenderingContext) {
            this.context.transferFromImageBitmap(renderBatch.bitmap);
        }
        else if (this.context instanceof CanvasRenderingContext2D) {
            const ctx = this.context;
            for (const iter of renderBatch.images) {
                const image = ctx.createImageData(iter.width, iter.height);
                const data = windowAny.Blazor.runtime.localHeapViewU8().subarray(iter.data, iter.data + (iter.width * iter.height * 4));
                image.data.set(data);
                ctx.putImageData(image, iter.x, iter.y);
            }
            if (renderBatch.text.length) {
                ctx.save();
                ctx.font = 'bold 13px Times New Roman';
                if (renderBatch.clip) {
                    const clip = renderBatch.clip;
                    ctx.beginPath();
                    ctx.rect(clip.x0, clip.y0, clip.x1 - clip.x0, clip.y1 - clip.y0);
                    ctx.clip();
                }
                for (const iter of renderBatch.text) {
                    const red = ((iter.color >> 16) & 0xFF);
                    const green = ((iter.color >> 8) & 0xFF);
                    const blue = (iter.color & 0xFF);
                    ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
                    ctx.fillText(iter.text, iter.x, iter.y);
                }
                ctx.restore();
            }
        }
    }
}
