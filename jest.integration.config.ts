import type {Config} from 'jest';
import {defaults} from 'jest-config';

const config: Config = {
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'mts'],
  testMatch: ['<rootDir>/**/*.i.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/jest.integration.setup.ts'],
  preset: 'ts-jest',
  verbose: true
};

export default config;