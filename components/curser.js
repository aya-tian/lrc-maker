import { convertTimeToTag } from "../lrc-parser.js";
import { audioRef, audioStatePubSub, currentTimePubSub } from "../utils/audiomodule.js";
const { useState, useEffect, useRef } = React;
export const Curser = ({ fixed }) => {
    const self = useRef(Symbol(Curser.name));
    const [time, setTime] = useState(audioRef.currentTime);
    const [paused, setPaused] = useState(audioRef.paused);
    const [rate, setRate] = useState(audioRef.playbackRate);
    useEffect(() => {
        audioStatePubSub.sub(self.current, (data) => {
            switch (data.type) {
                case 0: {
                    setPaused(data.payload);
                    break;
                }
                case 2: {
                    setRate(data.payload);
                    break;
                }
            }
        });
        return () => {
            audioStatePubSub.unsub(self.current);
        };
    }, []);
    useEffect(() => {
        const B = [1, 10, 100, 1000][fixed] * rate;
        if (paused || 2 * B > 60) {
            currentTimePubSub.sub(self.current, (date) => {
                setTime(date);
            });
            return () => {
                currentTimePubSub.unsub(self.current);
            };
        }
        else {
            const id = setInterval(() => {
                setTime(audioRef.currentTime);
            }, 1000 / (2 * B));
            return () => {
                clearInterval(id);
            };
        }
    }, [fixed, paused, rate]);
    return React.createElement("time", { className: "curser" }, convertTimeToTag(time, fixed));
};
//# sourceMappingURL=curser.js.map