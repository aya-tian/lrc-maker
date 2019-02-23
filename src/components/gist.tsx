import { Action as LrcAction, ActionType as LrcActionType } from "../hooks/useLrc.js";
import {
    assignRepo,
    createRepo,
    getFils,
    getRepos,
    GistInfo,
    IGistFile,
    IGistRepo,
    Ratelimit,
} from "../utils/gistapi.js";
import { appContext } from "./app.context.js";
import { AkariNotFound, AkariOangoLoading } from "./svg.img.js";
import { EditorSVG, GithubSVG, SynchronizerSVG } from "./svg.js";
import { toastPubSub } from "./toast.js";

const { useCallback, useContext, useEffect, useMemo, useState } = React;

const newTokenUrl = "https://github.com/settings/tokens/new?scopes=gist&description=https://lrc-maker.github.io";

const disableCheck = {
    autoCapitalize: "none",
    autoComplete: "off",
    autoCorrect: "off",
    spellCheck: false,
};

interface IGistProps {
    lrcDispatch: React.Dispatch<LrcAction>;
    langName: string;
}

export const Gist: React.FC<IGistProps> = ({ lrcDispatch, langName }) => {
    const { lang, trimOptions } = useContext(appContext);

    const [token, setToken] = useState(localStorage.getItem(LSK.token));
    const [gistId, setGistId] = useState(localStorage.getItem(LSK.gistId));
    const [gistIdList, setGistIdList] = useState<string[] | undefined>(undefined);
    const [fileList, setFileList] = useState<IGistFile[] | null>(JSON.parse(localStorage.getItem(LSK.gistFile)!));

    const ratelimit: Ratelimit | null = useMemo(() => {
        return JSON.parse(sessionStorage.getItem(SSK.ratelimit)!);
    }, [fileList]);

    const onSubmitToken = useCallback((ev: React.FormEvent<HTMLFormElement>) => {
        ev.preventDefault();

        const form = ev.target as HTMLFormElement;
        const tokenInput = form.elements.namedItem("token")! as HTMLInputElement;

        const value = tokenInput.value;

        localStorage.setItem(LSK.token, value);
        setToken(value);
    }, []);

    const onCreateNewGist = useCallback(() => {
        createRepo()
            .then((json: IGistRepo) => {
                localStorage.setItem(LSK.gistId, json.id);
                setGistId(json.id);
            })
            .catch((error) => {
                toastPubSub.pub({
                    type: "warning",
                    text: error.message,
                });
            });
    }, []);

    const onSubmitGistId = useCallback((ev: React.FormEvent<HTMLFormElement>) => {
        ev.preventDefault();

        const form = ev.target as HTMLFormElement;
        const gistIdInput = form.elements.namedItem("gist-id")! as HTMLInputElement;
        const value = gistIdInput.value;

        localStorage.setItem(LSK.gistId, value);
        setGistId(value);

        assignRepo().catch((error) => {
            toastPubSub.pub({
                type: "warning",
                text: error.message,
            });
        });
    }, []);

    useEffect(() => {
        if (gistId !== null || token === null) {
            return;
        }

        if (!("HTMLDataListElement" in window)) {
            return;
        }

        getRepos()
            .then((result) => {
                setGistIdList(
                    result
                        .filter((gist) => {
                            return gist.description === GistInfo.description && GistInfo.fileName in gist.files;
                        })
                        .map(({ id }) => id),
                );
            })
            .catch((error) => {
                toastPubSub.pub({
                    type: "warning",
                    text: error.message,
                });
            });
    }, [token, gistId]);

    useEffect(() => {
        if (gistId === null) {
            return;
        }

        getFils()
            .then((result) => {
                if (result === null) {
                    return;
                }

                const files = Object.values(result.files).filter((file) => file.filename.endsWith(".lrc"));
                localStorage.setItem(
                    LSK.gistFile,
                    JSON.stringify(files, ["filename", "content", "truncated", "raw_url"]),
                );
                setFileList(files);
            })
            .catch((error) => {
                toastPubSub.pub({
                    type: "warning",
                    text: error.message,
                });
            });
    }, [gistId]);

    const onFileLoad = useCallback((ev: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const target = ev.target as HTMLElement;

        if (!("key" in target.dataset)) {
            return;
        }

        const key = Number.parseInt(target.dataset.key!, 10);
        const file = fileList![key];
        if (file.truncated) {
            fetch(file.raw_url)
                .then((res) => res.text())
                .then((text) => {
                    lrcDispatch({
                        type: LrcActionType.parse,
                        payload: { text, options: trimOptions },
                    });
                })
                .catch((error) => {
                    toastPubSub.pub({
                        type: "warning",
                        text: error.message,
                    });
                });
        } else {
            lrcDispatch({
                type: LrcActionType.parse,
                payload: { text: file.content, options: trimOptions },
            });
        }
    }, []);

    const onClear = useCallback(() => {
        setGistId(null);
        setToken(null);
    }, []);

    const RateLimit = useMemo(() => {
        if (ratelimit === null) {
            return false;
        }

        const RatelimitReset = new Intl.DateTimeFormat(langName, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false,
        }).format(new Date(Number.parseInt(ratelimit["x-ratelimit-reset"], 10) * 1000));

        return (
            <section className="ratelimit">
                <p>
                    {"ratelimit-limit: "}
                    {ratelimit["x-ratelimit-limit"]}
                </p>
                <p>
                    {"ratelimit-remaining: "}
                    {ratelimit["x-ratelimit-remaining"]}
                </p>
                <p>
                    {"ratelimit-reset: "}
                    {RatelimitReset}
                </p>
            </section>
        );
    }, [ratelimit, langName]);

    const GistDetails: React.FC = useCallback(() => {
        if (gistId !== null && token !== null) {
            return (
                <details className="gist-details">
                    <summary>{lang.gist.info}</summary>
                    <section className="gist-bar">
                        <section className="gist-info">
                            <p>
                                {"Gist id: "}
                                <a href={`https://gist.github.com/${gistId}`} target="_blank" className="link">
                                    {gistId}
                                </a>
                            </p>
                            <button className="button" onClick={onClear}>
                                {lang.gist.clearTokenAndGist}
                            </button>
                        </section>
                        {RateLimit}
                    </section>
                </details>
            );
        }
        return null;
    }, [gistId, token, RateLimit]);

    const NewToken = useMemo(() => {
        if (token === null) {
            return (
                <section className="new-token">
                    <GithubSVG />
                    <p className="new-token-tip-text">{lang.gist.newTokenTip}</p>
                    <a className="new-token-tip button" target="_blank" href={newTokenUrl}>
                        {lang.gist.newTokenButton}
                    </a>
                    <form className="new-token-form" onSubmit={onSubmitToken}>
                        <label htmlFor="github-token">Token:</label>
                        <input
                            type="text"
                            className="new-token-input"
                            id="github-token"
                            name="token"
                            key="token"
                            minLength={40}
                            maxLength={40}
                            required={true}
                            {...disableCheck}
                        />
                        <input className="new-token-submit button" type="submit" />
                    </form>
                </section>
            );
        }
    }, [token, lang]);

    const NewGistID = useMemo(() => {
        if (gistId === null) {
            const option = (id: string) => {
                return <option key={id} value={id} />;
            };
            const gistIdDataList = gistIdList && (
                <datalist id="gist-list">{gistIdList.map((id) => option(id))};</datalist>
            );

            return (
                <section className="get-gist-id">
                    <GithubSVG />
                    <p className="gist-id-tip-text">{lang.gist.newGistTip}</p>
                    <button className="create-new-gist button" onClick={onCreateNewGist}>
                        {lang.gist.newGistRepoButton}
                    </button>
                    <form className="gist-id-form" onSubmit={onSubmitGistId}>
                        <label htmlFor="gist-id">Gist id:</label>
                        <input
                            type="text"
                            className="gist-id-input"
                            id="gist-id"
                            name="gist-id"
                            key="gist-id"
                            list="gist-list"
                            placeholder={lang.gist.gistIdPlaceholder}
                            required={true}
                            {...disableCheck}
                        />

                        <input className="button" type="submit" />
                        {gistIdDataList}
                    </form>
                </section>
            );
        }
    }, [gistId, lang, gistIdList]);

    const FileCardList = useMemo(() => {
        if (fileList !== null) {
            const FileCard = (file: IGistFile, index: number) => {
                return (
                    <article className="file-item" key={file.raw_url}>
                        <section className="file-content">{file.content}</section>
                        <hr />
                        <section className="file-bar">
                            <span className="file-title">{file.filename}</span>
                            <span className="file-action">
                                <a className="file-load" href={Path.editor} data-key={index}>
                                    <EditorSVG />
                                </a>
                                <a className="file-load" href={Path.synchronizer} data-key={index}>
                                    <SynchronizerSVG />
                                </a>
                            </span>
                        </section>
                    </article>
                );
            };
            if (fileList.length === 0) {
                return (
                    <section className="gist-no-data">
                        <AkariNotFound />
                    </section>
                );
            }

            return (
                <section className="file-list" onClick={onFileLoad}>
                    {fileList.map(FileCard)}
                </section>
            );
        }
    }, [fileList]);

    return (
        <div className="gist">
            <GistDetails />
            {NewToken || NewGistID || FileCardList || <GistLoading />}
        </div>
    );
};

const GistLoading = React.memo(() => {
    return (
        <section className="gist-loading">
            <AkariOangoLoading />
        </section>
    );
});
