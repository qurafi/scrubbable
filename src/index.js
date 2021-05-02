import defaults from "./defaults";
import cursor from "./cursor";
import { listen, getLockedElement, clamp } from "./utils";

const noop = () => {};

const scrubbables = new WeakMap();
let activeElement;

let cursorSVG; // pointer-lock hide cursor by default

let mouseX = 0;
let mouseY = 0;
let lastMouseX = 0;

export default function Scrubbable(elm, config) {
    elm.requestPointerLock =
        elm.requestPointerLock ||
        elm.mozRequestPointerLock ||
        elm.webkitRequestPointerLock ||
        noop;

    const el = config.zone || elm;
    const events = [
        listen(el, "mousedown", onMouseDown),
        listen(el, "mousemove", changeMouseIcon),
        listen(el, "mouseleave", changeMouseIcon),
    ];

    const isInput = ["INPUT", "TEXTAREA", "PROGRESS", "METER"].some((tag) => {
        return tag == elm.tagName;
    });

    if (isInput) assignInputAttrs(elm, config, defaults);

    if ((isInput || elm.isContentEditable) && !config.noUpdate) {
        events.push(listen(elm, "input", onInputChange));
    }

    config = { ...defaults, ...config, elm, isInput };

    if (config.decimals === undefined) {
        const s = config.step.toString();
        config.decimals = Math.max(0, s.length - (s | 0).toString().length - 1);
    }

    if (isInput && config.width == "padding") {
        const style = getComputedStyle(elm);
        const padding = parseInt(style[`padding-${config.location}`], 10);

        if (!isNaN(padding)) config.width = parseInt(padding);
    }

    scrubbables.set(config.zone || elm, config);

    config.destroy = function () {
        cancelScrubbing();
        events.forEach((remove) => remove());
        scrubbables.delete(config.zone || elm);
    };

    return config;
}

const inputAttrs = ["value", "min", "max", "step"];
function assignInputAttrs(el, config, defaults) {
    inputAttrs.forEach((prop) => {
        if (config[prop] === undefined) {
            config[prop] = +el[prop] || defaults[prop];
        }
        el[prop] = config[prop];
    });
}

function onMouseDown(e) {
    if (e.button !== 0 || !checkMouseZone(e)) return;

    activeElement = this;
    mouseX = lastMouseX = e.clientX;
    mouseY = e.clientY;

    this.requestPointerLock();
    updateMousePosition();

    document.documentElement.style.cursor = "ew-resize";

    listen(document, "mouseup", cancelScrubbing, { once: true });
    listen(document, "mousemove", onMouseMove, false);
}

function onMouseMove(e) {
    const config = scrubbables.get(activeElement);
    if (!config) return;

    const isLocked = getLockedElement();
    const dx = (isLocked ? e.movementX : e.clientX - mouseX) | 0;

    !isLocked && config.elm.blur(); // prevent text selection

    mouseX += dx;

    if (Math.abs(mouseX - lastMouseX) > config.threshold) {
        const acc = clamp(dx, -config.maxAcc, config.maxAcc);
        const increment = acc * config.step;

        config.value = clamp(config.value + increment, config.min, config.max);

        if (config.update) {
            let value = config.value;
            if (config.decimals) {
                value = value.toFixed(config.decimals);
            }

            config.update(value, increment, config);
        }

        config.onScrub(config.value, increment, config);
        lastMouseX = mouseX;
    }

    if (isLocked) {
        if (mouseX < 0) mouseX = window.innerWidth;
        if (mouseX > window.innerWidth) mouseX = 0;
    }

    updateMousePosition();
}

function updateMousePosition() {
    cursorSVG.style.transform = `translate(${mouseX - 10}px, ${mouseY - 3}px)`;
}

function checkMouseZone(e) {
    const elm = activeElement || e.currentTarget;
    const opt = scrubbables.get(elm);
    const rect = elm.getBoundingClientRect();

    return (
        opt.zone ||
        opt.width == "full" ||
        Math.abs(rect[opt.location] - e.clientX) < opt.width
    );
}

function changeMouseIcon(e) {
    const set = e.type == "mouseleave" || checkMouseZone(e);
    this.style.cursor = set ? "ew-resize" : "";
}

function cancelScrubbing() {
    document.exitPointerLock();
    document.removeEventListener("mousemove", onMouseMove, false);
    document.documentElement.style.cursor = "";
    cursorSVG.style.display = "none";
    activeElement = undefined;
}

function onInputChange() {
    const config = scrubbables.get(this);
    if (config) {
        config.value = parseInt(config.isInput ? this.value : this.textContent, 10);
    }
}

listen(window, "load", () => {
    document.body.insertAdjacentHTML("beforeend", cursor);
    cursorSVG = document.body.lastElementChild;
    cursorSVG.style.cssText = `position:fixed;top:0;left:0;display:none;`;
});

function onPointerLockChange() {
    if (getLockedElement()) cursorSVG.style.display = "block";
}

listen(document, "pointerlockchange", onPointerLockChange, false);
listen(document, "mozpointerlockchange", onPointerLockChange, false);
listen(document, "webkitpointerlockchange", onPointerLockChange, false);

document.exitPointerLock =
    document.exitPointerLock ||
    document.mozExitPointerLock ||
    document.webkitExitPointerLock ||
    noop;
