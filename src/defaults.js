export default {
    width: 8,
    location: "left",

    value: 0,
    min: 0,
    max: Infinity,
    step: 1,

    threshold: 14,
    maxAcc: 2,

    update(value) {
        let attr = this.elm instanceof Element && !this.isInput ? "textContent" : "value";
        this.elm[attr] = value;
    },

    onScrub: () => {},
};
