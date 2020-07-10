const number = document.querySelectorAll("input[type='number']");
const text = document.querySelectorAll("input[type='text']");

const sliders = document.getElementById('sliders');
const configuration = [
	{
		title: 'Formatting',
		element: 'input',
		attrs: {
			type: 'text',
			min: 0,
			value: 0,
			max: 100,
		},
		options: {
			format: v => `${v}%`,
		},
	},
	{
		title: 'Decimals',
		element: 'input',
		attrs: {
			type: 'text',
			min: 0,
			max: 10,
			value: 0,
			step: 0.25,
		},
		options: {
			format: v => v.toFixed(2),
			threshold: 24,
		},
	},
	{
		title: 'Right Direction',
		element: 'input',
		attrs: {
			type: 'text',
			min: 0,
			value: 0,
			max: 100,
		},
		options: {
			direction: 'right',
		},
	},
	{
		title: 'Custom width',
		element: 'input',
		attrs: {
			type: 'text',
			min: 0,
			value: 0,
			max: 100,
		},

		options: {
			direction: 'left',
			width: 100,
		},
	},

	{
		title: 'Work with other elements : progress',
		element: 'progress',
		attrs: {
			min: 0,
			max: 100,
			value: 0,
		},

		options: {
			width: 15,
			threshold: 4,
			// maxMovementX: Infinity,
		},
	},
	{
		title: 'Work with other elements : meter',
		element: 'meter',
		attrs: {
			min: 0,
			max: 100,
			low: 80,
			value: 0,
		},

		options: {
			width: 15,
			threshold: 4,
		},
	},
];

configuration.forEach(v => {
	let id = v.title.replace(/\s/g, '-');

	let useValue = ['option', 'input', 'progress', 'meter'].some(t => v.element == t);

	let el = document.createElement(v.element);
	el.id = id;
	el[useValue ? 'value' : 'textContent'] = v.attrs.value;
	if (v.attrs) for (let attr in v.attrs) el[attr] = v.attrs[attr];

	let label = document.createElement('label');
	label.textContent = v.title;
	label.htmlFor = id;

	let button = document.createElement('button');
	button.textContent = 'show code';
	button.onclick = () => showCode(v);
	let container = document.createElement('div');
	container.appendChild(label);
	container.appendChild(el);
	container.appendChild(button);

	sliders.insertBefore(container, custom_slider.parentElement);
	new SideSlider(el, v.options);
});

function showCode(v) {
	let html = '';
	if (v === 0) {
		html = custom_slider_code;
	} else {
		html = `sideSlider(el, ${JSON.stringify(
			v.options,
			Object.keys(v.options).sort(),
			'\t'
		).replace(/"(.*?)":/g, '$1:')});`;
	}

	let code = document.getElementById('code');
	code.style.display = 'block';

	code.previousElementSibling.textContent = v.title;

	code.style.background = '#555';
	setTimeout(() => (code.style.background = ''), 250);

	code.innerHTML = html
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\//g, '&sol;')
		.replace(/(\w*)\(/g, '<b>$1(</b>')
		.replace(/(,|:|true|false|let|return|&lt;|&gt;|&sol;)/g, '<b>$1</b>')
		.replace(/("|')(.*?)\1/g, '<i>$1$2$1</i>')
		.replace(/\d|new/g, '<span>$&</span>')
		.replace(/#(\w*)/g, '<b>$&</b>')
		.replace(/(.*):\s*(.*);$/gm, '$1:<b>$2</b>;');
}

new SideSlider(custom_slider.firstElementChild, {
	width: 15,
	onChange: e => (custom_slider.lastElementChild.style.width = `${e.value}%`),
	format: v => `${v} %`,
});

const custom_slider_code = `
// html

<div>
	<label>Highly Customizable</label>
	<div id="custom_slider">
		<input type="text"></input>
		<span></span>
	</div>
	<button onclick="showCode(0)">Show Code</button>
</div>

// javascript
new SideSlider(custom_slider.firstElementChild, {
	width: 15,
	onChange: e => (custom_slider.lastElementChild.style.width = \`\${e.value}%\`),
	format: v => \`\${v} %\`,
});

// style
#custom_slider {
	position: relative;
	overflow: hidden;
	width: 100%;
	height: 1.5em;
	border-radius: 4px;
	padding: 0.25em;
	margin-top: 0.25em;
	background: #bbb;
	text-align: center;
	box-sizing: border-box;
}

#custom_slider * {
	position: absolute;
	padding: 0;
	margin: 0;
	top: 0;
	left: 0;
	height: 100%;
}

#custom_slider input {
	margin: 0;
	padding: 0;
	z-index: 1;
	border: none;
	outline: none;
	background: transparent;
	width: 100%;
	text-align: center;
}

#custom_slider span {
	width: 0;
	background: #999;
	pointer-events: none;
}
`;

showCode(configuration[0]);
