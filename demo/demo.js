const wrapper = document.getElementById("wrapper");
const ref = wrapper.children[1];

const configuration = [
    {
        title: "Basic",
        element: "input",
        attrs: {
            type: "text",
            min: 0,
            value: 0,
            max: 100,
        },
        options: {},
    },
    {
        title: "Step",
        element: "input",
        attrs: {
            type: "text",
            min: 0,
            max: 10,
            value: 0,
            step: 0.255,
        },
        options: {
            threshold: 24,
        },
    },
    {
        title: "Right Direction",
        element: "input",
        attrs: {
            type: "text",
            min: 0,
            value: 0,
            max: 100,
        },
        options: {
            location: "right",
        },
    },
    {
        title: "Custom width",
        element: "input",
        attrs: {
            type: "text",
            min: 0,
            value: 0,
            max: 100,
        },
        options: {
            width: 100,
        },
    },
    {
        title: "No acceleration limit",
        element: "input",
        attrs: {
            type: "text",
            min: 0,
            value: 0,
        },
        options: {
            maxAcc: Infinity,
        },
    },
    {
        title: "Can work with other elements: span",
        element: "span",
        attrs: {
            value: 0, //textContent
            contentEditable: true,
        },
        options: {
            min: -100,
            max: 100,
            value: 0,
            threshold: 24,
        },
    },
    {
        title: "Can work with other elements: progress",
        element: "progress",
        attrs: {
            min: 0,
            max: 100,
            value: 0,
        },
        options: {
            width: 15,
            threshold: 15,
        },
    },
];

configuration.forEach((v) => {
    const useValue = ["option", "input", "progress", "meter"].some((t) => v.element == t);

    const el = document.createElement(v.element);
    el[useValue ? "value" : "textContent"] = v.attrs.value;
    if (v.attrs) for (const attr in v.attrs) el[attr] = v.attrs[attr];

    const label = document.createElement("label");
    label.textContent = v.title;

    const container = document.createElement("div");
    container.appendChild(label);
    container.appendChild(el);

    wrapper.insertBefore(container, ref);
    Scrubbable(el, v.options);
});

function customZone() {
    const custom_zone = document.getElementById("custom_zone");
    const [zone, input] = custom_zone.children;
    Scrubbable(input, { zone });
}

customZone();
