
class Helper {
    public static fromBase64ToUint8Array = (base64: string): Uint8Array => {
        //new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)))
        return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    }

    public static onError = (err, action = "error") => {
        if (err instanceof Error) {
            alert(`Action: ${action} Error: ${err.toString()} Stack: ${err.stack}`);
            //worker.postMessage({ action, error: err.toString(), stack: err.stack });
        } else {
            alert(`Action: ${action} Error: ${err.toString()}`);
            //worker.postMessage({ action, error: err.toString() });
        }
    }

    public static tryApi = (func) => {
        try {
            func();
        } catch (e) {
            Helper.onError(e);
        }
    }
}
