export const createPubSub = () => {
    const bus = new Map();
    const pub = (data) => {
        Array.from(bus.values()).forEach((cb) => cb(data));
    };
    const sub = (id, cb) => {
        bus.set(id, cb);
    };
    const unsub = (id) => {
        bus.delete(id);
    };
    return { pub, sub, unsub };
};
//# sourceMappingURL=pubsub.js.map