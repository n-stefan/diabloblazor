
declare const base64js: any;

class Helper {
    public static fromBase64ToUint8Array = (base64: string): Uint8Array => {
        //new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)))
        //return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        return base64js.toByteArray(base64);
    }

    public static fromUint8ArrayToBase64 = (array: Uint8Array): string => {
        return base64js.fromByteArray(array);
    }

    public static onError = (err: Error | any, action = 'error'): void => {
        if (err instanceof Error) {
            alert(`Action: ${action} Error: ${err.toString()} Stack: ${err.stack}`);
        } else {
            alert(`Action: ${action} Error: ${err.toString()}`);
        }
    }

    public static tryApi = (func: Function): void => {
        try {
            func();
        } catch (e) {
            Helper.onError(e);
        }
    }
}
