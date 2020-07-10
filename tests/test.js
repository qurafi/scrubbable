let sliders = new iSlider('.islider', {
	maxMovementX: 15,
	step: 0.5,
	format: d => d.toFixed(2) + '%',
	onChange: function (e) {},
});
