import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist", "node_modules"] },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ["**/*.{ts,tsx}"],
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],
            // 允許 unused 變數以 _ 開頭
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            // 允許 any（漸進式收緊）
            "@typescript-eslint/no-explicit-any": "warn",
            // useEffect 內 setState 在初始化場景常見，先降為 warn
            "react-hooks/set-state-in-effect": "warn",
            // 以下規則先降為 warn，待存量修完再收緊為 error
            "no-useless-assignment": "warn",
            "prefer-const": "warn",
            "no-irregular-whitespace": "warn",
            "no-useless-escape": "warn",
            "@typescript-eslint/no-unused-expressions": "warn",
            "no-sparse-arrays": "warn",
            "react-hooks/purity": "warn",
        },
    }
);
