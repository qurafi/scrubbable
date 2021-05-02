import babel from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";
const prd = !process.env.ROLLUP_WATCH;

export default {
    input: "src/index.js",
    output: {
        name: "Scrubbable",
        //TODO: change to index.js
        file: `dist/scrubbable.${prd ? "min." : ""}js`,
        format: "umd",
        sourcemap: true,
    },
    plugins: [
        babel({
            babelHelpers: "bundled",
            exclude: "node_modules/**",
        }),
        prd && terser(),
    ],
};
