
class Progress {
    public constructor(
        private readonly message: string,
        private readonly bytesLoaded: number,
        private readonly total: number) {
    }
}
