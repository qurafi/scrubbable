document.exitPointerLock =
	document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;

const vendor =
	'onmozpointerlockchange' in document
		? 'moz'
		: 'onwebkitpointerlockchange' in document
		? 'webkit'
		: '';

const onPointerChange = vendor + 'pointerlockchange';

// used to store individual sliders configuration
// using map over regular object because regular objects can only store keys as strings and Maps can store multple types such as objects in our case
const Sliders = new Map();

// defualt configuration
// DO NOT remove any properties from this object. this is also used for type checking :)
const defaults = {
	min: 0,
	max: 100,
	step: 1,
	width: 4,
	threshold: 4,
	maxMovementX: 2,
	updateElement: true,
	direction: 'left',
	format: v => v.toFixed(0), // round number by default
};

// this is because pointer lock api hides mouse by default so we create a fake mouse to indicate current mouse position to user and lock its position with x-axis only
const mouse = document.createElement('span');
window.addEventListener('load', () => document.body.appendChild(mouse));

const mouseSize = 20; // default fake mouse size
const mouseStyle = {
	fontSize: mouseSize + 'px',
	display: 'none',
	zIndex: 2 ** 31 - 1, // make sure our mouse is visible and on the top of each element
	position: 'fixed',
	top: 0,
	left: 0,
	lineHeight: 0,
};

// apply style to the fake mouse
for (const s in mouseStyle) mouse.style[s] = mouseStyle[s];
mouse.textContent = '↔';

function validateParamsAndAssignDefaults(el, options) {
	if (!(el && el instanceof HTMLElement)) throw new TypeError('HTMLElement required');

	for (const k in defaults) {
		if (options[k] === undefined) options[k] = +el[k] || defaults[k];

		// check for valid types from defaults object
		const v = options[k];
		if (typeof v !== typeof defaults[k] || (typeof v == 'number' && isNaN(v)))
			throw new TypeError(`"${k}:${v}" is invalid paramater`);
	}
}

function getUpdateType(el) {
	let updateValue = ['OPTION', 'INPUT', 'PROGRESS', 'METER'].some(v => el.tagName == v);
	return updateValue ? 'value' : 'textContent';
}

class SideSlider {
	constructor(el, options = {}) {
		if (typeof el === 'string') {
			let elms = document.querySelectorAll(el);
			return Array.prototype.map.call(elms, v => new SideSlider(v, options));
		}

		validateParamsAndAssignDefaults(el, options);

		this.el = el;
		Object.assign(this, options);

		el.requestPointerLock =
			el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock;

		el.addEventListener('mousedown', onMouseDown);
		el.addEventListener('mousemove', updateMouseIcon);
		el.addEventListener('mouseleave', resetGlobalCursor);

		if (['SELECT', 'INPUT', 'TEXTAREA'].some(v => el.tagName === v)) {
			el.addEventListener('input', trackInputValue);
			el.addEventListener('change', trackInputValue);
		}
		let value = getUpdateType(el);
		el[value] = this.value || this.min;
		this.value = +el[value];

		if (this.format) el[value] = this.format(+el[value]);

		// store element and its configuration in Sliders Map object
		Sliders.set(el, this);
	}

	destroy() {
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
}

function trackInputValue(e) {
	let value = parseFloat(this.value, 10);
	if (!isNaN(value)) updateValue(Sliders.get(this), value, e.type != 'change');
}

function resetGlobalCursor() {
	document.documentElement.style.cursor = '';
}

function updateMouseIcon(e) {
	let isInArea = isMouseInSliderArea(e);

	this.setAttribute('title', isInArea ? 'drag to adjust value' : '');

	this.style.cursor = isInArea ? 'ew-resize' : 'initial';

	if (isInArea) document.documentElement.style.cursor = 'ew-resize';
}

// return current element that requested pointer lock from requestPointerLock function
function getLockedElement() {
	return (
		document.pointerLockElement ||
		document.mozPointerLockElement ||
		document.webkitPointerLockElement
	);
}

let mouseX = 0;
let mouseY = 0;
let lastMouseX = 0;

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
	let lockedElement = getLockedElement();
	let isSlider = lockedElement && Sliders.get(lockedElement);

	mouse.style.display = isSlider ? 'block' : 'none';

	let action = isSlider ? 'add' : 'remove';
	this[action + 'EventListener']('mousemove', onMouseMove);
}

// check if user mouse in the edge of element
function isMouseInSliderArea(e) {
	let slider = Sliders.get(e.target);
	let rect = e.target.getBoundingClientRect();

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
	let newValue = clamp(value, slider.min, slider.max);

	if (typeof slider.onChange === 'function') {
		let returned = slider.onChange({
			value: newValue,
			prev: slider.value,
			delta: newValue - slider.value,
			slider,
			target: slider.el,
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

	slider.value = newValue;

	// change the element value/text and format if needed
	let content = getUpdateType(slider.el);
	if (slider.updateElement) {
		slider.el[content] =
			slider.format && !noFormat ? slider.format(slider.value) : slider.value;
	}
}

function onMouseMove(e) {
	let el = getLockedElement();
	if (!el) return;

	// normal mouse will stick to the edge of screen. but here we want the mouse to make infinite cycles when move through screen
	mouseX += e.movementX;
	mouseY += e.movementY;

	if (mouseX < 0) mouseX = window.innerWidth;
	if (mouseX > window.innerWidth) mouseX = 0;

	// update fake mouse position and lock it in y-axis at the center
	let rect = el.getBoundingClientRect();
	updateMousePosition(rect.top + mouseSize / 2);

	// get slider configurations
	let slider = Sliders.get(el);

	// if mouse movement exceeds the limit, then adjust the value by the given step value
	// this is useful for higher precision
	// 4+ is recommended for threshold value
	if (Math.abs(mouseX - lastMouseX) >= slider.threshold) {
		let deltaX = clamp(e.movementX, -slider.maxMovementX, slider.maxMovementX);

		let increment = deltaX * slider.step;

		updateValue(slider, slider.value + increment);

		// to track next movement
		lastMouseX = mouseX;
	}
}

document.addEventListener(onPointerChange, onPointerLockChange, false);
export default SideSlider;
