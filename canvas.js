const canvas = document.getElementById("canvas_1");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 400;

const redInput = document.getElementById("red");
const greenInput = document.getElementById("green");
const blueInput = document.getElementById("blue");

const inputs = [redInput, greenInput, blueInput];
const color = [0, 0, 0];

const scrubbingConfig = {
    min: 0,
    max: 255,
    step: 1,
    threshold: 8,
    maxAcc: 3,
    onScrub() {
        onChange({ target: this.elm });
    },
};

function onChange(e) {
    const colorIndx = inputs.indexOf(e.target);
    color[colorIndx] = e.target.value;
    render();
}

inputs.forEach((input) => {
    input.addEventListener("input", onChange);
    Scrubbable(input, { ...scrubbingConfig, zone: input.previousElementSibling });
});

function render() {
    let { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = `rgb(${color.join()})`;
    ctx.fillRect(0, 0, width, height);
}

render();
