export function listen(el, ev, cb, opt) {
    el.addEventListener(ev, cb, opt);
    return () => el.removeEventListener(ev, cb, opt);
}

export function getLockedElement() {
    return (
        document.pointerLockElement ||
        document.mozPointerLockElement ||
        document.webkitPointerLockElement
    );
}

export function clamp(v, min, max) {
    return Math.min(max, Math.max(v, min));
}
