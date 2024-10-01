import type { MetadataBearer } from '@smithy/types';
import type { AwsCommand } from 'aws-sdk-client-mock';
import type { SinonSpyCall } from 'sinon';

// type declaration for compatibility with both Jest and Vitest
// --------------------------------------------------------------
type EqualsFunction = (
  a: unknown,
  b: unknown,
  customTesters?: Array<Tester>,
  strictCheck?: boolean
) => boolean;

type Tester = (
  this: TesterContext,
  a: any,
  b: any,
  customTesters: Array<Tester>
) => boolean | undefined;
interface TesterContext {
  equals: EqualsFunction;
}

interface CommonMatcherUtils {
  printReceived: (object: unknown) => string;
  printExpected: (value: unknown) => string;
}

interface CommonMatcherContext<T extends CommonMatcherUtils> {
  isNot?: boolean;
  equals: EqualsFunction;
  utils: T;
}

interface ExpectationResult {
  message: () => string;
  pass: boolean;
}

interface MatcherFunction<
  T extends CommonMatcherUtils = CommonMatcherUtils,
  U extends CommonMatcherContext<T> = CommonMatcherContext<T>,
> {
  (this: U, received: any, expected: any, ...others: any[]): ExpectationResult;
}

// --------------------------------------------------------------


type AnyCommand = AwsCommand<any, any>;
type AnySpyCall = SinonSpyCall<[AnyCommand]>;

interface AwsSdkMockBaseMatchers<R> extends Record<string, Function> {
  /**
   * Asserts the {@link AwsStub Client Mock} received given `Command` exact number of times.
   *
   * @example
   * ```js
   * expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, 2);
   * ```
   *
   * @param command AWS SDK Command type
   * @param times Number of expected calls
   */
  toHaveReceivedCommandTimes<TCmdInput extends object,
      TCmdOutput extends MetadataBearer>(
      command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
      times: number,
  ): R;

  /**
   * Asserts the {@link AwsStub Client Mock} received given `Command` at least one time.
   *
   * @example
   * ```js
   * expect(snsMock).toHaveReceivedCommandTimes(PublishCommand);
   * ```
   *
   * @param command AWS SDK Command type
   */
  toHaveReceivedCommand<TCmdInput extends object,
      TCmdOutput extends MetadataBearer>(
      command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
  ): R;

  /**
   * Asserts the {@link AwsStub Client Mock} received given `Command` at least one time with matching input.
   *
   * @example
   * ```js
   * expect(snsMock).toHaveReceivedCommandWith(
   *   PublishCommand,
   *   {
   *     Message: 'hello world',
   *   },
   * );
   * ```
   *
   * @example
   * With asymmetric matcher:
   * ```js
   * expect(snsMock).toHaveReceivedCommandWith(
   *   PublishCommand,
   *   {
   *     Message: expect.stringContaining('hello'),
   *   },
   * );
   * ```
   *
   * @param command AWS SDK Command type
   * @param input Partial input to match
   */
  toHaveReceivedCommandWith<TCmdInput extends object,
      TCmdOutput extends MetadataBearer>(
      command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
      input: Partial<{
          [Property in keyof TCmdInput]: unknown;
      }>,
  ): R;

  /**
   * Asserts the nth call to the {@link AwsStub Client Mock} was a given `Command` with matching input.
   *
   * @example
   * The second call to `SNSClient` was a `PublishCommand` with Message 'hello world':
   * ```js
   * expect(snsMock).toHaveReceivedNthCommandWith(
   *   2,
   *   PublishCommand,
   *   {
   *     Message: 'hello world',
   *   },
   * );
   * ```
   *
   * @param call Call number
   * @param command AWS SDK Command type
   * @param input Partial input to match
   */
  toHaveReceivedNthCommandWith<TCmdInput extends object,
      TCmdOutput extends MetadataBearer>(
      call: number,
      command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
      input: Partial<{
          [Property in keyof TCmdInput]: unknown;
      }>,
  ): R;

  /**
   * Asserts the nth `Command` of given type sent to the {@link AwsStub Client Mock} had matching input.
   *
   * @example
   * The second `PublishCommand` sent to `SNSClient` had Message 'hello world':
   * ```js
   * expect(snsMock).toHaveReceivedNthSpecificCommandWith(
   *   2,
   *   PublishCommand,
   *   {
   *     Message: 'hello world',
   *   },
   * );
   * ```
   *
   * @param call Call number
   * @param command AWS SDK Command type
   * @param input Partial input to match
   */
  toHaveReceivedNthSpecificCommandWith<TCmdInput extends object, TCmdOutput extends MetadataBearer>(
      call: number,
      command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
      input: Partial<{
          [Property in keyof TCmdInput]: unknown;
      }>,
  ): R;

  /**
   * Asserts {@link AwsStub Client Mock} was called at least once with any `Command`.
   */
  toHaveReceivedAnyCommand(): R;
}

interface AwsSdkMockAliasMatchers<R> extends Record<string, Function> {
  /**
   * @see toHaveReceivedCommandTimes
   */
  toReceiveCommandTimes<TCmdInput extends object,
      TCmdOutput extends MetadataBearer>(
      command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
      times: number,
  ): R;

  /**
   * @see toHaveReceivedCommand
   */
  toReceiveCommand<TCmdInput extends object,
      TCmdOutput extends MetadataBearer>(
      command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
  ): R;

  /**
   * @see toHaveReceivedCommandWith
   */
  toReceiveCommandWith<TCmdInput extends object,
      TCmdOutput extends MetadataBearer>(
      command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
      input: Partial<{
          [Property in keyof TCmdInput]: unknown;
      }>,
  ): R;

  /**
   * @see toHaveReceivedNthCommandWith
   */
  toReceiveNthCommandWith<TCmdInput extends object,
      TCmdOutput extends MetadataBearer>(
      call: number,
      command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
      input: Partial<{
          [Property in keyof TCmdInput]: unknown;
      }>,
  ): R;

  /**
   * @see toHaveReceivedNthSpecificCommandWith
   */
  toReceiveNthSpecificCommandWith<TCmdInput extends object, TCmdOutput extends MetadataBearer>(
      call: number,
      command: new (input: TCmdInput) => AwsCommand<TCmdInput, TCmdOutput>,
      input: Partial<{
          [Property in keyof TCmdInput]: unknown;
      }>,
  ): R;

  /**
   * @see toHaveReceivedAnyCommand
   */
  toReceiveAnyCommand(): R;
}


export { AnyCommand, AnySpyCall, AwsSdkMockAliasMatchers, AwsSdkMockBaseMatchers, CommonMatcherContext, CommonMatcherUtils, ExpectationResult, MatcherFunction };

