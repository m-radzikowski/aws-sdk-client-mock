/* eslint-disable @typescript-eslint/no-empty-interface */
import './jest';
import { AwsSdkMockMatchers } from './jestMatchers';

/**
 * Types for @jest/globals
 */
declare module 'expect' {
  interface Matchers<R = void> extends AwsSdkMockMatchers<R> {}
}
