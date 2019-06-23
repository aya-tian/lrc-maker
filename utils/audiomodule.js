import { createPubSub } from "./pubsub.js";
export const audioRef = {
    current: null,
    get src() {
        return this.current ? this.current.src : "";
    },
    get duration() {
        return this.current ? this.current.duration || 0 : 0;
    },
    get paused() {
        return this.current ? this.current.paused : true;
    },
    get playbackRate() {
        return this.current ? this.current.playbackRate : 1;
    },
    set playbackRate(rate) {
        if (this.current !== null) {
            this.current.playbackRate = rate;
        }
    },
    get currentTime() {
        return this.current ? this.current.currentTime : 0;
    },
    set currentTime(time) {
        if (this.current !== null && this.current.duration !== 0) {
            this.current.currentTime = time;
        }
    },
    toggle() {
        if (this.current && this.current.duration) {
            this.current.paused ? this.current.play() : this.current.pause();
        }
    },
};
export const audioStatePubSub = createPubSub();
export const currentTimePubSub = createPubSub();
//# sourceMappingURL=audiomodule.js.map