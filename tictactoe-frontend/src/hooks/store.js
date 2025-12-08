let providers = []

export const store = {
    value: () => providers,
    subscribe: (cb) => {
        function onAnnouncement(e) {
            if (providers.map((p) => p.info.uuid).includes(e.detail.info.uuid)) {
                return;
            }
            providers = [ ...providers, e.detail ];
            cb();
        }
        window.addEventListener("eip6963:announceProvider", onAnnouncement);
        window.dispatchEvent(new Event("eip6963:requestProvider"));
        return () => {
            window.removeEventListener("eip6963:announceProvider", onAnnouncement);
        }
    }
}
