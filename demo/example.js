const canvas = document.getElementById('canvas_1');
const ctx = canvas.getContext('2d');

const inputRed = document.getElementById('input_red');

let red = 0;

new SideSlider(inputRed, {
	min: 0,
	max: 255,
	step: 1,
	threshold: 8,
	maxMovementX: 6,
	onChange: function (e) {
		red = e.value;
		draw();
		console.log(e.value);
	},
});

function draw() {
	let { width, height } = canvas;
	ctx.clearRect(0, 0, width, height);

	ctx.fillStyle = `rgb(${red}, 0, 0)`;
	ctx.fillRect(0, 0, width, height);
}

draw();
