import { stringify } from "../lrc-parser.js";
import { DownloadSVG, LockSVG } from "./svg.js";
const { useState, useCallback } = React;
export const AsidePanel = React.memo(({ syncMode, setSyncMode, lrcDispatch, prefState }) => {
    const [href, setHref] = useState();
    const [name, setName] = useState();
    const onSyncModeToggle = useCallback(() => {
        setSyncMode(syncMode === 0 ? 1 : 0);
    }, [syncMode]);
    const onDownloadClick = useCallback(() => {
        lrcDispatch({
            type: 6,
            payload: (state) => {
                const text = stringify(state, prefState);
                setHref((url) => {
                    if (url) {
                        URL.revokeObjectURL(url);
                    }
                    return URL.createObjectURL(new Blob([text], {
                        type: "text/plain;charset=UTF-8",
                    }));
                });
                const info = state.info;
                const list = [];
                if (info.has("ti")) {
                    list.push(info.get("ti"));
                }
                if (info.has("ar")) {
                    list.push(info.get("ar"));
                }
                if (list.length === 0) {
                    if (info.has("al")) {
                        list.push(info.get("al"));
                    }
                    list.push(new Date().toLocaleString());
                }
                setName(list.join(" - ") + ".lrc");
            },
        });
    }, [prefState]);
    const className = [
        "aside-button",
        "syncmode-button",
        "ripple",
        "glow ",
        syncMode === 0 ? "select" : "highlight",
    ].join(" ");
    return (React.createElement("aside", { className: "aside-panel" },
        React.createElement("button", { className: className, onClick: onSyncModeToggle },
            React.createElement(LockSVG, null)),
        React.createElement("a", { href: href, download: name, className: "aside-button ripple glow", onClick: onDownloadClick },
            React.createElement(DownloadSVG, null))));
});
//# sourceMappingURL=asidepanel.js.map