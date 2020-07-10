var SideSlider = (function () {
  'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
  var vendor = 'onmozpointerlockchange' in document ? 'moz' : 'onwebkitpointerlockchange' in document ? 'webkit' : '';
  var onPointerChange = vendor + 'pointerlockchange'; // used to store individual sliders configuration
  // using map over regular object because regular objects can only store keys as strings and Maps can store multple types such as objects in our case

  var Sliders = new Map(); // defualt configuration
  // DO NOT remove any properties from this object. this is also used for type checking :)

  var defaults = {
    min: 0,
    max: 100,
    step: 1,
    width: 4,
    threshold: 4,
    maxMovementX: 2,
    updateElement: true,
    direction: 'left',
    format: function format(v) {
      return v.toFixed(0);
    } // round number by default

  }; // this is because pointer lock api hides mouse by default so we create a fake mouse to indicate current mouse position to user and lock its position with x-axis only

  var mouse = document.createElement('span');
  window.addEventListener('load', function () {
    return document.body.appendChild(mouse);
  });
  var mouseSize = 20; // default fake mouse size

  var mouseStyle = {
    fontSize: mouseSize + 'px',
    display: 'none',
    zIndex: Math.pow(2, 31) - 1,
    // make sure our mouse is visible and on the top of each element
    position: 'fixed',
    top: 0,
    left: 0,
    lineHeight: 0
  }; // apply style to the fake mouse

  for (var s in mouseStyle) {
    mouse.style[s] = mouseStyle[s];
  }

  mouse.textContent = '↔';

  function validateParamsAndAssignDefaults(el, options) {
    if (!(el && el instanceof HTMLElement)) throw new TypeError('HTMLElement required');

    for (var k in defaults) {
      if (options[k] === undefined) options[k] = +el[k] || defaults[k]; // check for valid types from defaults object

      var v = options[k];
      if (_typeof(v) !== _typeof(defaults[k]) || typeof v == 'number' && isNaN(v)) throw new TypeError("\"".concat(k, ":").concat(v, "\" is invalid paramater"));
    }
  }

  function getUpdateType(el) {
    var updateValue = ['OPTION', 'INPUT', 'PROGRESS', 'METER'].some(function (v) {
      return el.tagName == v;
    });
    return updateValue ? 'value' : 'textContent';
  }

  var SideSlider = /*#__PURE__*/function () {
    function SideSlider(el) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, SideSlider);

      if (typeof el === 'string') {
        var elms = document.querySelectorAll(el);
        return Array.prototype.map.call(elms, function (v) {
          return new SideSlider(v, options);
        });
      }

      validateParamsAndAssignDefaults(el, options);
      this.el = el;
      Object.assign(this, options);
      el.requestPointerLock = el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock;
      el.addEventListener('mousedown', onMouseDown);
      el.addEventListener('mousemove', updateMouseIcon);
      el.addEventListener('mouseleave', resetGlobalCursor);

      if (['SELECT', 'INPUT', 'TEXTAREA'].some(function (v) {
        return el.tagName === v;
      })) {
        el.addEventListener('input', trackInputValue);
        el.addEventListener('change', trackInputValue);
      }

      var value = getUpdateType(el);
      el[value] = this.value || this.min;
      this.value = +el[value];
      if (this.format) el[value] = this.format(+el[value]); // store element and its configuration in Sliders Map object

      Sliders.set(el, this);
    }

    _createClass(SideSlider, [{
      key: "destroy",
      value: function destroy() {
        this.el.removeEventListener('mousedown', onMouseDown);
        this.el.removeEventListener('mousemove', updateMouseIcon);
        this.el.removeEventListener('mouseleave', resetGlobalCursor);
        this.el.removeEventListener('mousemove', onMouseMove);
        this.el.removeEventListener('input', trackInputValue);
        this.el.removeEventListener('change', trackInputValue);
        this.el.style.cursor = 'initial';
        resetUserCursor();
        resetGlobalCursor();
        Sliders.delete(this.el);
      }
    }]);

    return SideSlider;
  }();

  function trackInputValue(e) {
    var value = parseFloat(this.value, 10);
    if (!isNaN(value)) updateValue(Sliders.get(this), value, e.type != 'change');
  }

  function resetGlobalCursor() {
    document.documentElement.style.cursor = '';
  }

  function updateMouseIcon(e) {
    var isInArea = isMouseInSliderArea(e);
    this.setAttribute('title', isInArea ? 'drag to adjust value' : '');
    this.style.cursor = isInArea ? 'ew-resize' : 'initial';
    if (isInArea) document.documentElement.style.cursor = 'ew-resize';
  } // return current element that requested pointer lock from requestPointerLock function


  function getLockedElement() {
    return document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement;
  }

  var mouseX = 0;
  var mouseY = 0;
  var lastMouseX = 0;

  function onMouseDown(e) {
    // e.button = 0(left mouse button)
    if (e.button !== 0) return;
    if (!isMouseInSliderArea(e)) return;
    this.requestPointerLock();
    lastMouseX = mouseX = e.clientX;
    mouseY = e.clientY;
    updateMousePosition();
    this.addEventListener('mouseup', resetUserCursor, false);
  }

  function resetUserCursor() {
    document.exitPointerLock();
    document.documentElement.style.cursor = '';
  }

  function onPointerLockChange() {
    var lockedElement = getLockedElement();
    var isSlider = lockedElement && Sliders.get(lockedElement);
    mouse.style.display = isSlider ? 'block' : 'none';
    var action = isSlider ? 'add' : 'remove';
    this[action + 'EventListener']('mousemove', onMouseMove);
  } // check if user mouse in the edge of element


  function isMouseInSliderArea(e) {
    var slider = Sliders.get(e.target);
    var rect = e.target.getBoundingClientRect();
    return Math.abs(rect[slider.direction] - e.clientX) < (slider.width || 4);
  }

  function updateMousePosition(y) {
    mouse.style.left = mouseX - mouseSize / 2 + 'px';
    mouse.style.top = (y || mouseY) + 'px';
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(v, min));
  }

  function updateValue(slider, value, noFormat) {
    // clamp the value between min and max value
    var newValue = clamp(value, slider.min, slider.max);

    if (typeof slider.onChange === 'function') {
      var returned = slider.onChange({
        value: newValue,
        prev: slider.value,
        delta: newValue - slider.value,
        slider: slider,
        target: slider.el
      });

      if (typeof returned === 'number' && !isNaN(returned)) {
        // if returned value is a number, then update the new value
        newValue = clamp(returned, slider.min, slider.max);
      } else if (returned === false) {
        // cancel the change of the new value
        return;
      }
    } else if (slider.onChange !== undefined) {
      throw new TypeError('onChange must be a function');
    }

    slider.value = newValue; // change the element value/text and format if needed

    var content = getUpdateType(slider.el);

    if (slider.updateElement) {
      slider.el[content] = slider.format && !noFormat ? slider.format(slider.value) : slider.value;
    }
  }

  function onMouseMove(e) {
    var el = getLockedElement();
    if (!el) return; // normal mouse will stick to the edge of screen. but here we want the mouse to make infinite cycles when move through screen

    mouseX += e.movementX;
    mouseY += e.movementY;
    if (mouseX < 0) mouseX = window.innerWidth;
    if (mouseX > window.innerWidth) mouseX = 0; // update fake mouse position and lock it in y-axis at the center

    var rect = el.getBoundingClientRect();
    updateMousePosition(rect.top + mouseSize / 2); // get slider configurations

    var slider = Sliders.get(el); // if mouse movement exceeds the limit, then adjust the value by the given step value
    // this is useful for higher precision
    // 4+ is recommended for threshold value

    if (Math.abs(mouseX - lastMouseX) >= slider.threshold) {
      var deltaX = clamp(e.movementX, -slider.maxMovementX, slider.maxMovementX);
      var increment = deltaX * slider.step;
      updateValue(slider, slider.value + increment); // to track next movement

      lastMouseX = mouseX;
    }
  }

  document.addEventListener(onPointerChange, onPointerLockChange, false);

  return SideSlider;

}());
