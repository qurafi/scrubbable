# Scrubbable
[Live Demo](https://mhmd-22.github.io/scrubbable/)

Lightweight library for creating scrubbable inputs to easily and precisely adjust values by taking advantage of Pointer Lock API.

## Preview
![image](https://github.com/mhmd-22/scrubbable/raw/main/preview/preview.gif)

## Example

```javascript
const canvas = document.getElementById('canvas_1');
const ctx = canvas.getContext('2d');

const inputRed = document.getElementById('input_red');

Scrubbable(inputRed, {
  min: 0,
  max: 255,
  step: 1,
  threshold: 16,
  onScrub: function (e) {
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = `rgb(${e.value}, 0, 0)`;
    ctx.fillRect(0, 0, width, height);
  },
});
```

Result:

![image](https://github.com/mhmd-22/scrubbable/raw/main/preview/example.gif)

[Live](https://mhmd-22.github.io/scrubbable/canvas.html)


More examples in [demo](/demo) folder

## Usage

`Scrubbable(element, options)`

**Element**: Any html element

**Options :**


-   **min**, **max**, **step**, and **value**. these values are inferred if input element is supplied. otherwise you must set this
- **decimals**(default: `auto`): this value is supplied to `Number.toFixed` before calling `update` function. the default is depends on `step` value. you can turn it off by setting it to false.

-   **width**(default: **`8`**) : If zone is not supplied. these values is used as the scrubbable area. you can set this value to `"full"` for full width or `"padding"` to use element padding
-   **threshold**(default: **`14`**) : Number of pixels needed to adjust one step, useful for higher precision.
-   **maxAcc**(default: **`2`**) : Limit the acceleration of mouse movement.
-   **zone**: set custom scrubbing area instead of input element. for example, you can set input labels as the scrubbing area.
-   **location**(default: **`left`**) : location of the scrubbing area if zone is not specified
-   **update** : set custom updater function. by default it will update value/textContent depends on element type.
-   **onScrub**(value, increment, config): called when scrubbing