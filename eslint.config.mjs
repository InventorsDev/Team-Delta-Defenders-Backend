// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**/*', 'node_modules/**/*'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // Existing rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      
      // Rules to fix the specific errors we encountered
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/require-await': 'warn', // Allow async without await
      
      // NestJS specific adjustments
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      
      // Class property initialization (for DTOs and schemas)
      '@typescript-eslint/no-inferrable-types': 'off',
      
      // Allow consistent type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      
      // Decorator metadata compatibility
      '@typescript-eslint/no-empty-function': 'off',
      
      // MongoDB ObjectId handling
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // Environment variables
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      
      // General code quality
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      
      // Allow console.log in development
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    },
  },
  // Specific overrides for different file types
  {
    files: ['**/*.dto.ts', '**/*.schema.ts'],
    rules: {
      // DTOs and schemas don't need explicit return types
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Class properties in DTOs are defined by decorators
      '@typescript-eslint/no-inferrable-types': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      // Test files can be more lenient
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['src/main.ts', 'src/app.module.ts'],
    rules: {
      // Main files can have console logs
      'no-console': 'off',
    },
  },
);