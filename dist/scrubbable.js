(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Scrubbable = factory());
}(this, (function () { 'use strict';

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};

      if (i % 2) {
        ownKeys(Object(source), true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(Object(source)).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }

    return target;
  }

  var defaults = {
    width: 8,
    location: "left",
    value: 0,
    min: 0,
    max: Infinity,
    step: 1,
    threshold: 14,
    maxAcc: 2,
    update: function update(value) {
      var attr = this.elm instanceof Element && !this.isInput ? "textContent" : "value";
      this.elm[attr] = value;
    },
    onScrub: function onScrub() {}
  };

  var cursor = "<svg version=\"1.1\" width=\"24\" viewBox=\"0 0 90 28\" xmlns=\"http://www.w3.org/2000/svg\">\n<g stroke=\"#ffffff\" stroke-width=\"2\">\n <path d=\"m21 .5c-.2-.1-16 13-16 13 0 .3 16 14 16 13 .07-.06.1-5 .1-10h47c.01 5 .05 10 .1 10 .2.1 16-13 16-13 0-.3-16-14-16-13-.07.06-.1 5-.1 10h-47c-.01-5-.05-10-.1-10z\"/>\n</g>\n</svg>";

  function listen(el, ev, cb, opt) {
    el.addEventListener(ev, cb, opt);
    return function () {
      return el.removeEventListener(ev, cb, opt);
    };
  }
  function getLockedElement() {
    return document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement;
  }
  function clamp(v, min, max) {
    return Math.min(max, Math.max(v, min));
  }

  var noop = function noop() {};

  var scrubbables = new WeakMap();
  var activeElement;
  var cursorSVG; // pointer-lock hide cursor by default

  var mouseX = 0;
  var mouseY = 0;
  var lastMouseX = 0;
  function Scrubbable(elm) {
    var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    elm.requestPointerLock = elm.requestPointerLock || elm.mozRequestPointerLock || elm.webkitRequestPointerLock || noop;
    var el = config.zone || elm;
    var events = [listen(el, "mousedown", onMouseDown), listen(el, "mousemove", changeMouseIcon), listen(el, "mouseleave", changeMouseIcon)];
    var isInput = ["INPUT", "TEXTAREA", "PROGRESS", "METER"].some(function (tag) {
      return tag == elm.tagName;
    });
    if (isInput) assignInputAttrs(elm, config, defaults);

    if ((isInput || elm.isContentEditable) && !config.noUpdate) {
      events.push(listen(elm, "input", onInputChange));
    }

    config = _objectSpread2(_objectSpread2(_objectSpread2({}, defaults), config), {}, {
      elm: elm,
      isInput: isInput
    });

    if (config.decimals === undefined) {
      var s = config.step.toString();
      config.decimals = Math.max(0, s.length - (s | 0).toString().length - 1);
    }

    if (isInput && config.width == "padding") {
      var style = getComputedStyle(elm);
      var padding = parseInt(style["padding-".concat(config.location)], 10);
      if (!isNaN(padding)) config.width = parseInt(padding);
    }

    scrubbables.set(config.zone || elm, config);

    config.destroy = function () {
      cancelScrubbing();
      events.forEach(function (remove) {
        return remove();
      });
      scrubbables.delete(config.zone || elm);
    };

    return config;
  }
  var inputAttrs = ["value", "min", "max", "step"];

  function assignInputAttrs(el, config, defaults) {
    inputAttrs.forEach(function (prop) {
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
    listen(document, "mouseup", cancelScrubbing, {
      once: true
    });
    listen(document, "mousemove", onMouseMove, false);
  }

  function onMouseMove(e) {
    var config = scrubbables.get(activeElement);
    if (!config) return;
    var isLocked = getLockedElement();
    var dx = (isLocked ? e.movementX : e.clientX - mouseX) | 0;
    !isLocked && config.elm.blur(); // prevent text selection

    mouseX += dx;

    if (Math.abs(mouseX - lastMouseX) > config.threshold) {
      var acc = clamp(dx, -config.maxAcc, config.maxAcc);
      var increment = acc * config.step;
      config.value = clamp(config.value + increment, config.min, config.max);

      if (config.update) {
        var value = config.value;

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
    cursorSVG.style.transform = "translate(".concat(mouseX - 10, "px, ").concat(mouseY - 3, "px)");
  }

  function checkMouseZone(e) {
    var elm = activeElement || e.currentTarget;
    var opt = scrubbables.get(elm);
    var rect = elm.getBoundingClientRect();
    return opt.zone || opt.width == "full" || Math.abs(rect[opt.location] - e.clientX) < opt.width;
  }

  function changeMouseIcon(e) {
    var set = e.type == "mouseleave" || checkMouseZone(e);
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
    var config = scrubbables.get(this);

    if (config) {
      config.value = parseInt(config.isInput ? this.value : this.textContent, 10);
    }
  }

  listen(window, "load", function () {
    document.body.insertAdjacentHTML("beforeend", cursor);
    cursorSVG = document.body.lastElementChild;
    cursorSVG.style.cssText = "position:fixed;top:0;left:0;display:none;";
  });

  function onPointerLockChange() {
    if (getLockedElement() && cursorSVG) cursorSVG.style.display = "block";
  }

  listen(document, "pointerlockchange", onPointerLockChange, false);
  listen(document, "mozpointerlockchange", onPointerLockChange, false);
  listen(document, "webkitpointerlockchange", onPointerLockChange, false);
  document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock || noop;

  return Scrubbable;

})));
//# sourceMappingURL=scrubbable.js.map
