import babel from "@rollup/plugin-babel";

export default {
    input: "src/index.js",
    output: {
        name: "Scrubbable",
        file: `dist/scrubbable.js`,
        format: "umd",
        sourcemap: true,
    },
    plugins: [
        babel({
            babelHelpers: "bundled",
            exclude: "node_modules/**",
        }),
    ],
};
