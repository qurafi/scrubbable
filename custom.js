const custom_slider = document.querySelector("#custom_slider div");
const input = custom_slider.firstElementChild;
input.value = 0;
input.onchange = onChange;
formatInput();

const scrubbing = Scrubbable(input, {
    width: 15,
    threshold: 8,
    min: 0,
    max: 100,
    value: 0,
    onScrub: onChange,
    noUpdate: true, // do not update scrubbing value when input is changed.
});

function onChange() {
    scrubbing.value = parseInt(input.value);
    custom_slider.lastElementChild.style.width = `${scrubbing.value}%`;
    formatInput();
}

function formatInput() {
    if (!input.value.endsWith("%")) input.value = `${input.value}%`;
}
