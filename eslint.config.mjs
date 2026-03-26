import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import svelte from "eslint-plugin-svelte";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default defineConfig([{
    ignores: ["*.js", "functions/**/*.js", "dist/**/*.js", "src/policy.ts"],
},
js.configs.recommended,
{
    ignores: ["*.js", "functions/**/*.js", "dist/**/*.js", "src/policy.ts"],
}, {
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },
    },
},
...svelte.configs.base,
{
    files: ["src/**/*.svelte"],
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },
    languageOptions: {
        parserOptions: {
            extraFileExtensions: [".svelte"],
            parser: tsParser,
        },
    },
    rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["warn", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
        }],
    },
},
{
    files: ["src/**/*.ts"],
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },
    languageOptions: {
        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",
    },
    rules: {
        "constructor-super": "off",
        "getter-return": "off",
        "no-array-constructor": "off",
        "no-class-assign": "off",
        "no-const-assign": "off",
        "no-dupe-args": "off",
        "no-dupe-class-members": "off",
        "no-dupe-keys": "off",
        "no-func-assign": "off",
        "no-import-assign": "off",
        "no-new-native-nonconstructor": "off",
        "no-new-symbol": "off",
        "no-obj-calls": "off",
        "no-redeclare": "off",
        "no-setter-return": "off",
        "no-this-before-super": "off",
        "no-undef": "off",
        "no-unreachable": "off",
        "no-unsafe-negation": "off",
        "no-unused-expressions": "off",
        "no-unused-vars": "off",
        "no-var": "error",
        "no-with": "off",
        "prefer-const": "error",
        "prefer-rest-params": "error",
        "prefer-spread": "error",
        "@typescript-eslint/ban-ts-comment": "error",
        "@typescript-eslint/no-array-constructor": "error",
        "@typescript-eslint/no-duplicate-enum-values": "error",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-empty-object-type": "error",
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-extra-non-null-assertion": "error",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-namespace": "error",
        "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
        "@typescript-eslint/no-require-imports": "error",
        "@typescript-eslint/no-this-alias": "error",
        "@typescript-eslint/no-unnecessary-type-constraint": "error",
        "@typescript-eslint/no-unsafe-declaration-merging": "error",
        "@typescript-eslint/no-unsafe-function-type": "error",
        "@typescript-eslint/no-unused-vars": ["warn", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
        }],
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/no-wrapper-object-types": "error",
        "@typescript-eslint/prefer-as-const": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/triple-slash-reference": "error",
        "no-async-promise-executor": "warn",
        "no-console": ["error", {
            allow: ["error", "info", "trace", "warn"],
        }],
        "no-fallthrough": "off",
        semi: ["error", "never"],
    },
}]);
