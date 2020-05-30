// https://observablehq.com/@mootari/range-slider@1005
import define1 from "./e93997d5089d7165@2173.js";
import define2 from "./3d9d1394d858ca97@403.js";
import define3 from "./e93997d5089d7165@2264.js";

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# Range Slider

This notebook implements a themable range input for lower and upper bounds:
<details>
<summary style="outline:none !important"><i>View a demonstration</i></summary>
<img src=https://i.imgur.com/KkHoemh.gif style="max-width:500px;border:1px solid #ddd">
</details>

Also provided is an optional light wrapper that mimics the widget APIs from Jeremy Ashkenas' [Inputs](https://observablehq.com/@jashkenas/inputs) notebook.

Todos:
- Options for min/max delta
- Keyboard controls
- Move non-default themes into separate notebook
`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---
## Example

Resize this slider's range by dragging either end, or drag the range as a whole to move it.
`
)});
  main.variable(observer("viewof test")).define("viewof test", ["rangeSlider","themes","theme","color"], function(rangeSlider,themes,theme,color){return(
rangeSlider({
  min: .5,
  max: 3,
  // Note that values must be specified as array of length 2.
  value: this ? this.value : [1, 1.9],
  // Custom slider CSS, replaces all styles.
  theme: themes[theme],
  // Overrides the range color. Support for range colors is up to the theme.
  color,
  format: '.0%',
  title: 'The optional title',
  description: 'The optional description.',
})
)});
  main.variable(observer("test")).define("test", ["Generators", "viewof test"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], function(md){return(
md`The widget value is an array containing the selected min and max value.`
)});
  main.variable(observer()).define(["test"], function(test){return(
test
)});
  main.variable(observer()).define(["md"], function(md){return(
md`Below are some controls to modify the example slider. Why don't you ...`
)});
  main.variable(observer("viewof theme")).define("viewof theme", ["radioWidget","themes"], function(radioWidget,themes){return(
radioWidget({
  title: '<span style="font-family:var(--serif);font-size:initial">... pick a different theme ...',
  options: Object.keys(themes),
  value: 'Flat',
})
)});
  main.variable(observer("theme")).define("theme", ["Generators", "viewof theme"], (G, _) => G.input(_));
  main.variable(observer("viewof color")).define("viewof color", ["colorWidget"], function(colorWidget){return(
colorWidget({
  title: '<span style="font-family:var(--serif);font-size:initial">... or range color?',
  value: '#3b99fc',
})
)});
  main.variable(observer("color")).define("color", ["Generators", "viewof color"], (G, _) => G.input(_));
  main.variable(observer("doc_changelog")).define("doc_changelog", ["md"], function(md)
{
  const rev = (n = '') => `[${n || 'latest'}](https://observablehq.com/@mootari/range-slider${n})`;
  return md`
---

## Changelog

- ${rev()}: Added new default theme "Flat", a more neutral version of the macOS Chrome theme. (via [Jed Fox](https://observablehq.com/@j-f1))
- ${rev('@930')}: Changelog start.
`;
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`---
## API
`
)});
  main.variable(observer()).define(["signature","rangeSlider","md"], function(signature,rangeSlider,md){return(
signature(rangeSlider, {
  description: md`
*Inputs* widget with an API similar to [\`slider()\`](https://observablehq.com/@jashkenas/inputs#slider).

Supports all [<code>rangeInput()</code>](#doc_rangeInput) options. Additionally the following options are supported:
${Object.entries({
      title: 'Title above widget, string. Optional.',
      description: 'Description below widget, string. Optional.',
      submit: 'Display submit button to apply changes, boolean. Optional, defaults to <code>false</code>.',
      getValue: 'Value callback, Function. Optional, defaults to <code>n => n.value.map(roundToPrecision)</code>.',
      color: 'CSS color for range. Optional, overrides theme\'s default color.',
      separator: 'Value separator. Optional, defaults to <code>" … "</code>.',
      precision: 'Number of decimals as Number. Optional, defaults to <code>3</code>.',
      format: 'Display format as [d3-format](https://github.com/d3/d3-format) string or Function. Optional, defaults to <code>v => v</code>.',
      display: 'Display formatter as Function. Optional, defaults to <code>v => v.map(format).join(separator)</code>',
    }).map(([k,v]) => `- \`${k}:\` ${v}\n`)}`

})
)});
  main.variable(observer("rangeSlider")).define("rangeSlider", ["rangeInput","d3format","widget","html"], function(rangeInput,d3format,widget,html){return(
function rangeSlider(options = {}) {
  const {min = 0, max = 1, step = 'any', value, color, theme} = options;
  const input = rangeInput({min, max, step, value, theme});
  if(color) input.style.color = color;

  const {precision = 3, format = v => v, display: _display, separator = ' … '} = options;
  const round   = (p => (p = 10 ** p, v => Math.round(v * p) / p))(precision);
  const output  = typeof format === 'function' ? format : d3format.format(format);
  const display = _display || (v => v.map(output).join(separator));
  
  const {
    title, description, submit,
    getValue = n => n.value.map(round),
  } = options;
  
  const w = widget({
    title, description, submit, display, getValue,
    form: Object.assign(html`<form>${input}`, {input}),
  });
  
  w.querySelector('output').style.display = 'inline-block';
  return w;
}
)});
  main.variable(observer("doc_rangeInput")).define("doc_rangeInput", ["signature","rangeInput","md"], function(signature,rangeInput,md){return(
signature(rangeInput, {
  description: md`
Basic input implementation. Supports custom themes.

Options:
${Object.entries({
  min: 'Minimum value, number. Optional, defaults to <code>0</code>.',
  max: 'Maximum value, number. Optional, defaults to <code>100</code>.',
  step: 'Range step, number. Optional, defaults to <code>1</code>.',
  value: 'Lower and upper range bounds, array of number. Optional, defaults to <code>[min, max]</code>.',
  theme: 'Widget CSS, string. Optional, defaults to [<code>theme_Flat</code>](#doc_theme_Flat).',
}).map(([k,v]) => `- \`${k}:\` ${v}\n`)}

`
})
)});
  main.variable(observer("rangeInput")).define("rangeInput", ["theme_Flat","randomScope","DOM","html","clamp","invalidation"], function(theme_Flat,randomScope,DOM,html,clamp,invalidation){return(
function rangeInput(options = {}) {
  const {
    min = 0,
    max = 100,
    step = 1,
    value = [min, max],
    theme = theme_Flat,
  } = options;
  
  const controls = {};
  const scope = randomScope();
  // Will be used to sanitize values while avoiding floating point issues.
  const input = DOM.element('input', {type: 'range', min, max, step});
  
  const dom = html`
<div class="${scope} range-slider" style="--range-min:10px;--range-max:80px">
  ${controls.track = html`<div class="range-track">
    ${controls.zone = html`<div class="range-track-zone">
      ${controls.range = html`<div class="range-select" tabindex=0>
        ${controls.min = html`<div class="thumb thumb-min" tabindex=0>`}
        ${controls.max = html`<div class="thumb thumb-max" tabindex=0>`}
      `}
    `}
  `}
  ${html`<style>${theme.replace(/:scope\b/g, '.'+scope)}`}
</div>`;
  dom.value = value;
  
  
  const updateRange = () => {
    const ratio = v => (v - min) / (max - min);
    dom.style.setProperty('--range-min', `${ratio(dom.value[0]) * 100}%`);
    dom.style.setProperty('--range-max', `${ratio(dom.value[1]) * 100}%`);
  };
  
  const setValue = (vmin, vmax) => {
    const sanitize = v => {
      input.value = v;
      return input.valueAsNumber;
    }
    const [pmin, pmax] = dom.value;
    vmin = sanitize(vmin);
    vmax = sanitize(vmax);
    dom.value[0] = vmin;
    dom.value[1] = vmax;
    updateRange();
    // Only dispatch if values have changed.
    if(pmin !== vmin || pmax !== vmax) {
      dom.dispatchEvent(new CustomEvent('input', {bubbles: true}));
    }
  };
  
  setValue(...dom.value);
  
  // Mousemove handlers.
  const handlers = new Map([
    [controls.min, (dt, ov) => {
      const v = clamp(min, ov[1], ov[0] + dt * (max - min));
      setValue(v, ov[1]);
    }],
    [controls.max, (dt, ov) => {
      const v = clamp(ov[0], max, ov[1] + dt * (max - min));
      setValue(ov[0], v);
    }],
    [controls.range, (dt, ov) => {
      const d = ov[1] - ov[0];
      const v = clamp(min, max - d, ov[0] + dt * (max - min));
      setValue(v, v + d);
    }],
  ]);
  
  // Returns client offset object.
  const pointer = e => e.touches ? e.touches[0] : e;
  // Note: Chrome defaults passive for touch events to true.
  const on  = (e, fn) => e.split(' ').map(e => document.addEventListener(e, fn, {passive: false}));
  const off = (e, fn) => e.split(' ').map(e => document.removeEventListener(e, fn, {passive: false}));
  
  let initialX, initialV, target, dragging = false;
  function handleDrag(e) {
    // Gracefully handle exit and reentry of the viewport.
    if(!e.buttons && !e.touches) {
      handleDragStop();
      return;
    }
    dragging = true;
    const w = controls.zone.getBoundingClientRect().width;
    e.preventDefault();
    handlers.get(target)((pointer(e).clientX - initialX) / w, initialV);
  }
  
  
  function handleDragStop(e) {
    off('mousemove touchmove', handleDrag);
    off('mouseup touchend', handleDragStop);
  }
  
  invalidation.then(handleDragStop);
  
  dom.ontouchstart = dom.onmousedown = e => {
    dragging = false;
    if(!handlers.has(e.target)) return;
    on('mousemove touchmove', handleDrag);
    on('mouseup touchend', handleDragStop);
    e.preventDefault();
    e.stopPropagation();
    
    target = e.target;
    initialX = pointer(e).clientX;
    initialV = dom.value.slice();
  };
  
  controls.track.onclick = e => {
    if(dragging) return;
    const r = controls.zone.getBoundingClientRect();
    const t = clamp(0, 1, (pointer(e).clientX - r.left) / r.width);
    const v = min + t * (max - min);
    const [vmin, vmax] = dom.value, d = vmax - vmin;
    if(v < vmin) setValue(v, v + d);
    else if(v > vmax) setValue(v - d, v);
  };
  
  return dom;
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---
## Themes
`
)});
  main.variable(observer("doc_theme_Flat")).define("doc_theme_Flat", ["signature"], function(signature){return(
signature('theme_Flat', {
  name: 'theme_Flat',
  description: `Default theme. An unshaded version of [\`theme_GoogleChrome_MacOS1013\`](#doc_theme_GoogleChrome_MacOS1013).`
})
)});
  main.variable(observer("theme_Flat")).define("theme_Flat", function(){return(
`
:scope {
  position: relative;
  display: inline-block;
  width: 240px;
  --thumb-size: 15px;
  --thumb-radius: calc(var(--thumb-size) / 2);
  padding: var(--thumb-radius) 0;
  color: #3b99fc;
  margin: 2px;
  vertical-align: middle;
}
:scope .range-track {
  box-sizing: border-box;
  position: relative;
  height: 7px;
  background-color: hsl(0, 0%, 80%);
  overflow: visible;
  border-radius: 4px;
  padding: 0 var(--thumb-radius);
}
:scope .range-track-zone {
  box-sizing: border-box;
  position: relative;
}
:scope .range-select {
  box-sizing: border-box;
  position: relative;
  left: var(--range-min);
  width: calc(var(--range-max) - var(--range-min));
  cursor: ew-resize;
  background: currentColor;
  height: 7px;
  border: inherit;
}
/* Expands the hotspot area. */
:scope .range-select:before {
  content: "";
  position: absolute;
  width: 100%;
  height: var(--thumb-size);
  left: 0;
  top: calc(2px - var(--thumb-radius));
}
:scope .range-select:focus,
:scope .thumb:focus {
  outline: none;
}
:scope .thumb {
  box-sizing: border-box;
  position: absolute;
  width: var(--thumb-size);
  height: var(--thumb-size);

  background: #fcfcfc;
  top: -4px;
  border-radius: 100%;
  border: 1px solid hsl(0,0%,55%);
  cursor: default;
  margin: 0;
}
:scope .thumb:active {
  box-shadow: inset 0 var(--thumb-size) #0002;
}
:scope .thumb-min {
  left: calc(-1px - var(--thumb-radius));
}
:scope .thumb-max {
  right: calc(-1px - var(--thumb-radius));
}
`
)});
  main.variable(observer("doc_theme_GoogleChrome_MacOS1013")).define("doc_theme_GoogleChrome_MacOS1013", ["signature"], function(signature){return(
signature('theme_GoogleChrome_MacOS1013', {
  name: 'theme_GoogleChrome_MacOS1013',
  description: `Matches the style of range inputs in Google Chrome on macOS 10.13.`
})
)});
  main.variable(observer("theme_GoogleChrome_MacOS1013")).define("theme_GoogleChrome_MacOS1013", function(){return(
`
:scope {
  position: relative;
  display: inline-block;
  width: 240px;
  --thumb-size: 15px;
  --thumb-radius: calc(var(--thumb-size) / 2);
  padding: var(--thumb-radius) 0;
  color: #3b99fc;
  margin: 2px;
  vertical-align: middle;
}
:scope .range-track {
  box-sizing: border-box;
  position: relative;
  height: 5px;
  background-color: hsl(0, 0%, 80%);
  box-shadow: inset 0 1px 3px -1px rgba(0,0,0,0.33);
  overflow: visible;
  border-radius: 3px;
  border: 1px inset hsl(0, 0%, 70%);
  padding: 0 var(--thumb-radius);
}
:scope .range-track-zone {
  box-sizing: border-box;
  position: relative;
}
:scope .range-select {
  box-sizing: border-box;
  position: relative;
  left: var(--range-min);
  width: calc(var(--range-max) - var(--range-min));
  cursor: ew-resize;
  background: currentColor;
  height: 5px;
  top: -1px;
  border: inherit;
}
/* Expands the hotspot area. */
:scope .range-select:before {
  content: "";
  position: absolute;
  width: 100%;
  height: var(--thumb-size);
  left: 0;
  top: calc(2px - var(--thumb-radius));
}
:scope .range-select:focus,
:scope .thumb:focus {
  outline: none;
}
:scope .thumb {
  box-sizing: border-box;
  position: absolute;
  width: var(--thumb-size);
  height: var(--thumb-size);

  background: #eee linear-gradient(0deg, #fff0 50%, #fff9 50%, #fff5);
  top: -5px;
  border-radius: 100%;
  border: 1px solid hsl(0,0%,55%);
  cursor: default;
  margin: 0;
}
:scope .thumb:active {
  box-shadow: inset 0 var(--thumb-size) #0002;
}
:scope .thumb-min {
  left: calc(-1px - var(--thumb-radius));
}
:scope .thumb-max {
  right: calc(-1px - var(--thumb-radius));
}
`
)});
  main.variable(observer("doc_theme_Retro1")).define("doc_theme_Retro1", ["signature"], function(signature){return(
signature('theme_Retro1', {
  name: 'theme_Retro1',
  description: `Minimal theme that showcases the bare requirements.`
})
)});
  main.variable(observer("theme_Retro1")).define("theme_Retro1", function(){return(
`
:scope {
  position: relative;
  display: inline-block;
  width: 240px;
  color: #3b99fc;
  vertical-align: -10px;
  margin: 2px;
}
:scope .range-track {
  height: 20px;
  border: 2px solid #000;
  padding: 0 18px;
  position: relative;
  background: #fff url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAPUlEQVQoU2NkYGD4z8DAwMiAH/wnpACunWyFIGeAAIYB6ALYFILFiLGaaIXY3YIrlLBZjdVDIIXoAY7VQwD4rQoH9uQ3nwAAAABJRU5ErkJggg==");
}
:scope .range-track-zone {
  position: relative;
  height: 100%;
}
:scope .range-select {
  box-sizing: border-box;
  position: relative;
  left: var(--range-min);
  width: calc(var(--range-max) - var(--range-min));
  height: 100%;
  cursor: ew-resize;
  background: currentColor url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAAK0lEQVQoU2NkwA/+g6QZqaEIbAY2k8BWIMuRrQjDmTCTMKxAVkmSIrwhAQBStQYIBYnwugAAAABJRU5ErkJggg==") fixed;
}
:scope .range-select:focus,
:scope .thumb:focus {
  outline: none;
}
:scope .thumb {
  box-sizing: border-box;
  position: absolute;
  height: 100%;
  top: 0;
  width: 20px;
  background: #fff;
  border: 2px solid #000;
  border-width: 0 2px;
  cursor: default;
}
:scope .thumb:active {
  background: #000;
}
:scope .thumb-min {
  left: -20px;
}
:scope .thumb-max {
  right: -20px;
}
`
)});
  main.variable(observer("doc_theme_NoUiSlider")).define("doc_theme_NoUiSlider", ["signature"], function(signature){return(
signature('theme_NoUiSlider', {
  name: 'theme_NoUiSlider',
  description: `Replicates the style of the [noUiSlider library](https://refreshless.com/nouislider/examples/).`
})
)});
  main.variable(observer("theme_NoUiSlider")).define("theme_NoUiSlider", function(){return(
`
:scope {
  box-sizing: border-box;
  display: inline-block;
  width: 240px;
  color: #3b99fc;
  vertical-align: middle;
}

:scope .range-track {
  box-sizing: border-box;
  margin: 0 17px;
  position: relative;
  background: #FAFAFA;
  border-radius: 4px;
  border: 1px solid #D3D3D3;
  box-shadow: inset 0 1px 1px #F0F0F0, 0 3px 6px -5px #BBB;
  height: 18px;
}
:scope .range-select {
  box-sizing: border-box;
  position: absolute;
  background: currentColor;
  left: var(--range-min);
  width: calc(var(--range-max) - var(--range-min));
  height: 100%;
  cursor: ew-resize;
}
:scope .thumb {
  box-sizing: border-box;
  position: absolute;
  width: 34px;
  height: 28px;
  top: -6px;
  border: 1px solid #D9D9D9;
  border-radius: 3px;
  background: #FFF;
  cursor: default;
  box-shadow: inset 0 0 1px #FFF, inset 0 1px 7px #EBEBEB, 0 3px 6px -3px #BBB;
}
:scope .thumb:before,
:scope .thumb:after {
  content: "";
  display: block;
  position: absolute;
  height: 14px;
  width: 1px;
  background: #E8E7E6;
  left: 14px;
  top: 6px;
}
:scope .thumb:after {
  left: 17px;
}
:scope .thumb-min {
  left: -17px;
}
:scope .thumb-max {
  right: -17px;
}
`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---
## Helpers
`
)});
  main.variable(observer("randomScope")).define("randomScope", function(){return(
function randomScope(prefix = 'scope-') {
  return prefix + (performance.now() + Math.random()).toString(32).replace('.', '-');
}
)});
  main.variable(observer("clamp")).define("clamp", function(){return(
function clamp(a, b, v) {
  return v < a ? a : v > b ? b : v;
}
)});
  main.variable(observer("themes")).define("themes", ["theme_Flat","theme_GoogleChrome_MacOS1013","theme_NoUiSlider","theme_Retro1"], function(theme_Flat,theme_GoogleChrome_MacOS1013,theme_NoUiSlider,theme_Retro1){return(
{
  'Flat': theme_Flat,
  'Chrome macOS': theme_GoogleChrome_MacOS1013,
  'noUiSlider': theme_NoUiSlider,
  'Retro': theme_Retro1,
}
)});
  main.variable(observer()).define(["md"], function(md){return(
md`---
## Optional Dependencies

The basic implementation \`rangeInput()\` has no additional dependencies.
`
)});
  const child1 = runtime.module(define1);
  main.import("input", "widget", child1);
  main.import("d3format", child1);
  main.variable(observer()).define(["md"], function(md){return(
md`---
## Demo Dependencies`
)});
  const child2 = runtime.module(define2);
  main.import("signature", child2);
  const child3 = runtime.module(define3);
  main.import("color", "colorWidget", child3);
  main.import("radio", "radioWidget", child3);
  return main;
}
