import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
const prd = !process.env.ROLLUP_WATCH;

export default {
	input: 'src/SideSlider.js',
	output: {
		name: 'SideSlider',
		file: `dist/sideslider.${prd ? 'min.' : ''}js`,
		format: 'iife',
	},
	plugins: [
		babel({
			babelHelpers: 'bundled',
			exclude: 'node_modules/**',
		}),
		prd && terser(),
	],
};
