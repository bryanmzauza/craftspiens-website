
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Nlogin
 * 
 */
export type Nlogin = $Result.DefaultSelection<Prisma.$NloginPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Nlogins
 * const nlogins = await prisma.nlogin.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Nlogins
   * const nlogins = await prisma.nlogin.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.nlogin`: Exposes CRUD operations for the **Nlogin** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Nlogins
    * const nlogins = await prisma.nlogin.findMany()
    * ```
    */
  get nlogin(): Prisma.NloginDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.5.0
   * Query Engine version: 280c870be64f457428992c43c1f6d557fab6e29e
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Nlogin: 'Nlogin'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "nlogin"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Nlogin: {
        payload: Prisma.$NloginPayload<ExtArgs>
        fields: Prisma.NloginFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NloginFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NloginPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NloginFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NloginPayload>
          }
          findFirst: {
            args: Prisma.NloginFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NloginPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NloginFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NloginPayload>
          }
          findMany: {
            args: Prisma.NloginFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NloginPayload>[]
          }
          create: {
            args: Prisma.NloginCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NloginPayload>
          }
          createMany: {
            args: Prisma.NloginCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.NloginDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NloginPayload>
          }
          update: {
            args: Prisma.NloginUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NloginPayload>
          }
          deleteMany: {
            args: Prisma.NloginDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NloginUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.NloginUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NloginPayload>
          }
          aggregate: {
            args: Prisma.NloginAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNlogin>
          }
          groupBy: {
            args: Prisma.NloginGroupByArgs<ExtArgs>
            result: $Utils.Optional<NloginGroupByOutputType>[]
          }
          count: {
            args: Prisma.NloginCountArgs<ExtArgs>
            result: $Utils.Optional<NloginCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    nlogin?: NloginOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model Nlogin
   */

  export type AggregateNlogin = {
    _count: NloginCountAggregateOutputType | null
    _avg: NloginAvgAggregateOutputType | null
    _sum: NloginSumAggregateOutputType | null
    _min: NloginMinAggregateOutputType | null
    _max: NloginMaxAggregateOutputType | null
  }

  export type NloginAvgAggregateOutputType = {
    id: number | null
  }

  export type NloginSumAggregateOutputType = {
    id: number | null
  }

  export type NloginMinAggregateOutputType = {
    id: number | null
    last_name: string | null
    unique_id: string | null
    mojang_id: string | null
    bedrock_id: string | null
    password: string | null
    ip: string | null
    last_seen: Date | null
    creation_date: Date | null
    email: string | null
    discord: string | null
    settings: string | null
  }

  export type NloginMaxAggregateOutputType = {
    id: number | null
    last_name: string | null
    unique_id: string | null
    mojang_id: string | null
    bedrock_id: string | null
    password: string | null
    ip: string | null
    last_seen: Date | null
    creation_date: Date | null
    email: string | null
    discord: string | null
    settings: string | null
  }

  export type NloginCountAggregateOutputType = {
    id: number
    last_name: number
    unique_id: number
    mojang_id: number
    bedrock_id: number
    password: number
    ip: number
    last_seen: number
    creation_date: number
    email: number
    discord: number
    settings: number
    _all: number
  }


  export type NloginAvgAggregateInputType = {
    id?: true
  }

  export type NloginSumAggregateInputType = {
    id?: true
  }

  export type NloginMinAggregateInputType = {
    id?: true
    last_name?: true
    unique_id?: true
    mojang_id?: true
    bedrock_id?: true
    password?: true
    ip?: true
    last_seen?: true
    creation_date?: true
    email?: true
    discord?: true
    settings?: true
  }

  export type NloginMaxAggregateInputType = {
    id?: true
    last_name?: true
    unique_id?: true
    mojang_id?: true
    bedrock_id?: true
    password?: true
    ip?: true
    last_seen?: true
    creation_date?: true
    email?: true
    discord?: true
    settings?: true
  }

  export type NloginCountAggregateInputType = {
    id?: true
    last_name?: true
    unique_id?: true
    mojang_id?: true
    bedrock_id?: true
    password?: true
    ip?: true
    last_seen?: true
    creation_date?: true
    email?: true
    discord?: true
    settings?: true
    _all?: true
  }

  export type NloginAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Nlogin to aggregate.
     */
    where?: NloginWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Nlogins to fetch.
     */
    orderBy?: NloginOrderByWithRelationInput | NloginOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NloginWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Nlogins from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Nlogins.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Nlogins
    **/
    _count?: true | NloginCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: NloginAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: NloginSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NloginMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NloginMaxAggregateInputType
  }

  export type GetNloginAggregateType<T extends NloginAggregateArgs> = {
        [P in keyof T & keyof AggregateNlogin]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNlogin[P]>
      : GetScalarType<T[P], AggregateNlogin[P]>
  }




  export type NloginGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NloginWhereInput
    orderBy?: NloginOrderByWithAggregationInput | NloginOrderByWithAggregationInput[]
    by: NloginScalarFieldEnum[] | NloginScalarFieldEnum
    having?: NloginScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NloginCountAggregateInputType | true
    _avg?: NloginAvgAggregateInputType
    _sum?: NloginSumAggregateInputType
    _min?: NloginMinAggregateInputType
    _max?: NloginMaxAggregateInputType
  }

  export type NloginGroupByOutputType = {
    id: number
    last_name: string
    unique_id: string | null
    mojang_id: string | null
    bedrock_id: string | null
    password: string | null
    ip: string | null
    last_seen: Date
    creation_date: Date
    email: string | null
    discord: string | null
    settings: string | null
    _count: NloginCountAggregateOutputType | null
    _avg: NloginAvgAggregateOutputType | null
    _sum: NloginSumAggregateOutputType | null
    _min: NloginMinAggregateOutputType | null
    _max: NloginMaxAggregateOutputType | null
  }

  type GetNloginGroupByPayload<T extends NloginGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NloginGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NloginGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NloginGroupByOutputType[P]>
            : GetScalarType<T[P], NloginGroupByOutputType[P]>
        }
      >
    >


  export type NloginSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    last_name?: boolean
    unique_id?: boolean
    mojang_id?: boolean
    bedrock_id?: boolean
    password?: boolean
    ip?: boolean
    last_seen?: boolean
    creation_date?: boolean
    email?: boolean
    discord?: boolean
    settings?: boolean
  }, ExtArgs["result"]["nlogin"]>



  export type NloginSelectScalar = {
    id?: boolean
    last_name?: boolean
    unique_id?: boolean
    mojang_id?: boolean
    bedrock_id?: boolean
    password?: boolean
    ip?: boolean
    last_seen?: boolean
    creation_date?: boolean
    email?: boolean
    discord?: boolean
    settings?: boolean
  }

  export type NloginOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "last_name" | "unique_id" | "mojang_id" | "bedrock_id" | "password" | "ip" | "last_seen" | "creation_date" | "email" | "discord" | "settings", ExtArgs["result"]["nlogin"]>

  export type $NloginPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Nlogin"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      last_name: string
      unique_id: string | null
      mojang_id: string | null
      bedrock_id: string | null
      password: string | null
      ip: string | null
      last_seen: Date
      creation_date: Date
      email: string | null
      discord: string | null
      settings: string | null
    }, ExtArgs["result"]["nlogin"]>
    composites: {}
  }

  type NloginGetPayload<S extends boolean | null | undefined | NloginDefaultArgs> = $Result.GetResult<Prisma.$NloginPayload, S>

  type NloginCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<NloginFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: NloginCountAggregateInputType | true
    }

  export interface NloginDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Nlogin'], meta: { name: 'Nlogin' } }
    /**
     * Find zero or one Nlogin that matches the filter.
     * @param {NloginFindUniqueArgs} args - Arguments to find a Nlogin
     * @example
     * // Get one Nlogin
     * const nlogin = await prisma.nlogin.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NloginFindUniqueArgs>(args: SelectSubset<T, NloginFindUniqueArgs<ExtArgs>>): Prisma__NloginClient<$Result.GetResult<Prisma.$NloginPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Nlogin that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {NloginFindUniqueOrThrowArgs} args - Arguments to find a Nlogin
     * @example
     * // Get one Nlogin
     * const nlogin = await prisma.nlogin.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NloginFindUniqueOrThrowArgs>(args: SelectSubset<T, NloginFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NloginClient<$Result.GetResult<Prisma.$NloginPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Nlogin that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NloginFindFirstArgs} args - Arguments to find a Nlogin
     * @example
     * // Get one Nlogin
     * const nlogin = await prisma.nlogin.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NloginFindFirstArgs>(args?: SelectSubset<T, NloginFindFirstArgs<ExtArgs>>): Prisma__NloginClient<$Result.GetResult<Prisma.$NloginPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Nlogin that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NloginFindFirstOrThrowArgs} args - Arguments to find a Nlogin
     * @example
     * // Get one Nlogin
     * const nlogin = await prisma.nlogin.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NloginFindFirstOrThrowArgs>(args?: SelectSubset<T, NloginFindFirstOrThrowArgs<ExtArgs>>): Prisma__NloginClient<$Result.GetResult<Prisma.$NloginPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Nlogins that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NloginFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Nlogins
     * const nlogins = await prisma.nlogin.findMany()
     * 
     * // Get first 10 Nlogins
     * const nlogins = await prisma.nlogin.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const nloginWithIdOnly = await prisma.nlogin.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends NloginFindManyArgs>(args?: SelectSubset<T, NloginFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NloginPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Nlogin.
     * @param {NloginCreateArgs} args - Arguments to create a Nlogin.
     * @example
     * // Create one Nlogin
     * const Nlogin = await prisma.nlogin.create({
     *   data: {
     *     // ... data to create a Nlogin
     *   }
     * })
     * 
     */
    create<T extends NloginCreateArgs>(args: SelectSubset<T, NloginCreateArgs<ExtArgs>>): Prisma__NloginClient<$Result.GetResult<Prisma.$NloginPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Nlogins.
     * @param {NloginCreateManyArgs} args - Arguments to create many Nlogins.
     * @example
     * // Create many Nlogins
     * const nlogin = await prisma.nlogin.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NloginCreateManyArgs>(args?: SelectSubset<T, NloginCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Nlogin.
     * @param {NloginDeleteArgs} args - Arguments to delete one Nlogin.
     * @example
     * // Delete one Nlogin
     * const Nlogin = await prisma.nlogin.delete({
     *   where: {
     *     // ... filter to delete one Nlogin
     *   }
     * })
     * 
     */
    delete<T extends NloginDeleteArgs>(args: SelectSubset<T, NloginDeleteArgs<ExtArgs>>): Prisma__NloginClient<$Result.GetResult<Prisma.$NloginPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Nlogin.
     * @param {NloginUpdateArgs} args - Arguments to update one Nlogin.
     * @example
     * // Update one Nlogin
     * const nlogin = await prisma.nlogin.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NloginUpdateArgs>(args: SelectSubset<T, NloginUpdateArgs<ExtArgs>>): Prisma__NloginClient<$Result.GetResult<Prisma.$NloginPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Nlogins.
     * @param {NloginDeleteManyArgs} args - Arguments to filter Nlogins to delete.
     * @example
     * // Delete a few Nlogins
     * const { count } = await prisma.nlogin.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NloginDeleteManyArgs>(args?: SelectSubset<T, NloginDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Nlogins.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NloginUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Nlogins
     * const nlogin = await prisma.nlogin.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NloginUpdateManyArgs>(args: SelectSubset<T, NloginUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Nlogin.
     * @param {NloginUpsertArgs} args - Arguments to update or create a Nlogin.
     * @example
     * // Update or create a Nlogin
     * const nlogin = await prisma.nlogin.upsert({
     *   create: {
     *     // ... data to create a Nlogin
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Nlogin we want to update
     *   }
     * })
     */
    upsert<T extends NloginUpsertArgs>(args: SelectSubset<T, NloginUpsertArgs<ExtArgs>>): Prisma__NloginClient<$Result.GetResult<Prisma.$NloginPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Nlogins.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NloginCountArgs} args - Arguments to filter Nlogins to count.
     * @example
     * // Count the number of Nlogins
     * const count = await prisma.nlogin.count({
     *   where: {
     *     // ... the filter for the Nlogins we want to count
     *   }
     * })
    **/
    count<T extends NloginCountArgs>(
      args?: Subset<T, NloginCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NloginCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Nlogin.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NloginAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends NloginAggregateArgs>(args: Subset<T, NloginAggregateArgs>): Prisma.PrismaPromise<GetNloginAggregateType<T>>

    /**
     * Group by Nlogin.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NloginGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends NloginGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NloginGroupByArgs['orderBy'] }
        : { orderBy?: NloginGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, NloginGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNloginGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Nlogin model
   */
  readonly fields: NloginFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Nlogin.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NloginClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Nlogin model
   */
  interface NloginFieldRefs {
    readonly id: FieldRef<"Nlogin", 'Int'>
    readonly last_name: FieldRef<"Nlogin", 'String'>
    readonly unique_id: FieldRef<"Nlogin", 'String'>
    readonly mojang_id: FieldRef<"Nlogin", 'String'>
    readonly bedrock_id: FieldRef<"Nlogin", 'String'>
    readonly password: FieldRef<"Nlogin", 'String'>
    readonly ip: FieldRef<"Nlogin", 'String'>
    readonly last_seen: FieldRef<"Nlogin", 'DateTime'>
    readonly creation_date: FieldRef<"Nlogin", 'DateTime'>
    readonly email: FieldRef<"Nlogin", 'String'>
    readonly discord: FieldRef<"Nlogin", 'String'>
    readonly settings: FieldRef<"Nlogin", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Nlogin findUnique
   */
  export type NloginFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Nlogin
     */
    select?: NloginSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Nlogin
     */
    omit?: NloginOmit<ExtArgs> | null
    /**
     * Filter, which Nlogin to fetch.
     */
    where: NloginWhereUniqueInput
  }

  /**
   * Nlogin findUniqueOrThrow
   */
  export type NloginFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Nlogin
     */
    select?: NloginSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Nlogin
     */
    omit?: NloginOmit<ExtArgs> | null
    /**
     * Filter, which Nlogin to fetch.
     */
    where: NloginWhereUniqueInput
  }

  /**
   * Nlogin findFirst
   */
  export type NloginFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Nlogin
     */
    select?: NloginSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Nlogin
     */
    omit?: NloginOmit<ExtArgs> | null
    /**
     * Filter, which Nlogin to fetch.
     */
    where?: NloginWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Nlogins to fetch.
     */
    orderBy?: NloginOrderByWithRelationInput | NloginOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Nlogins.
     */
    cursor?: NloginWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Nlogins from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Nlogins.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Nlogins.
     */
    distinct?: NloginScalarFieldEnum | NloginScalarFieldEnum[]
  }

  /**
   * Nlogin findFirstOrThrow
   */
  export type NloginFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Nlogin
     */
    select?: NloginSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Nlogin
     */
    omit?: NloginOmit<ExtArgs> | null
    /**
     * Filter, which Nlogin to fetch.
     */
    where?: NloginWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Nlogins to fetch.
     */
    orderBy?: NloginOrderByWithRelationInput | NloginOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Nlogins.
     */
    cursor?: NloginWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Nlogins from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Nlogins.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Nlogins.
     */
    distinct?: NloginScalarFieldEnum | NloginScalarFieldEnum[]
  }

  /**
   * Nlogin findMany
   */
  export type NloginFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Nlogin
     */
    select?: NloginSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Nlogin
     */
    omit?: NloginOmit<ExtArgs> | null
    /**
     * Filter, which Nlogins to fetch.
     */
    where?: NloginWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Nlogins to fetch.
     */
    orderBy?: NloginOrderByWithRelationInput | NloginOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Nlogins.
     */
    cursor?: NloginWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Nlogins from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Nlogins.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Nlogins.
     */
    distinct?: NloginScalarFieldEnum | NloginScalarFieldEnum[]
  }

  /**
   * Nlogin create
   */
  export type NloginCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Nlogin
     */
    select?: NloginSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Nlogin
     */
    omit?: NloginOmit<ExtArgs> | null
    /**
     * The data needed to create a Nlogin.
     */
    data: XOR<NloginCreateInput, NloginUncheckedCreateInput>
  }

  /**
   * Nlogin createMany
   */
  export type NloginCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Nlogins.
     */
    data: NloginCreateManyInput | NloginCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Nlogin update
   */
  export type NloginUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Nlogin
     */
    select?: NloginSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Nlogin
     */
    omit?: NloginOmit<ExtArgs> | null
    /**
     * The data needed to update a Nlogin.
     */
    data: XOR<NloginUpdateInput, NloginUncheckedUpdateInput>
    /**
     * Choose, which Nlogin to update.
     */
    where: NloginWhereUniqueInput
  }

  /**
   * Nlogin updateMany
   */
  export type NloginUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Nlogins.
     */
    data: XOR<NloginUpdateManyMutationInput, NloginUncheckedUpdateManyInput>
    /**
     * Filter which Nlogins to update
     */
    where?: NloginWhereInput
    /**
     * Limit how many Nlogins to update.
     */
    limit?: number
  }

  /**
   * Nlogin upsert
   */
  export type NloginUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Nlogin
     */
    select?: NloginSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Nlogin
     */
    omit?: NloginOmit<ExtArgs> | null
    /**
     * The filter to search for the Nlogin to update in case it exists.
     */
    where: NloginWhereUniqueInput
    /**
     * In case the Nlogin found by the `where` argument doesn't exist, create a new Nlogin with this data.
     */
    create: XOR<NloginCreateInput, NloginUncheckedCreateInput>
    /**
     * In case the Nlogin was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NloginUpdateInput, NloginUncheckedUpdateInput>
  }

  /**
   * Nlogin delete
   */
  export type NloginDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Nlogin
     */
    select?: NloginSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Nlogin
     */
    omit?: NloginOmit<ExtArgs> | null
    /**
     * Filter which Nlogin to delete.
     */
    where: NloginWhereUniqueInput
  }

  /**
   * Nlogin deleteMany
   */
  export type NloginDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Nlogins to delete
     */
    where?: NloginWhereInput
    /**
     * Limit how many Nlogins to delete.
     */
    limit?: number
  }

  /**
   * Nlogin without action
   */
  export type NloginDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Nlogin
     */
    select?: NloginSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Nlogin
     */
    omit?: NloginOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const NloginScalarFieldEnum: {
    id: 'id',
    last_name: 'last_name',
    unique_id: 'unique_id',
    mojang_id: 'mojang_id',
    bedrock_id: 'bedrock_id',
    password: 'password',
    ip: 'ip',
    last_seen: 'last_seen',
    creation_date: 'creation_date',
    email: 'email',
    discord: 'discord',
    settings: 'settings'
  };

  export type NloginScalarFieldEnum = (typeof NloginScalarFieldEnum)[keyof typeof NloginScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const NloginOrderByRelevanceFieldEnum: {
    last_name: 'last_name',
    unique_id: 'unique_id',
    mojang_id: 'mojang_id',
    bedrock_id: 'bedrock_id',
    password: 'password',
    ip: 'ip',
    email: 'email',
    discord: 'discord',
    settings: 'settings'
  };

  export type NloginOrderByRelevanceFieldEnum = (typeof NloginOrderByRelevanceFieldEnum)[keyof typeof NloginOrderByRelevanceFieldEnum]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type NloginWhereInput = {
    AND?: NloginWhereInput | NloginWhereInput[]
    OR?: NloginWhereInput[]
    NOT?: NloginWhereInput | NloginWhereInput[]
    id?: IntFilter<"Nlogin"> | number
    last_name?: StringFilter<"Nlogin"> | string
    unique_id?: StringNullableFilter<"Nlogin"> | string | null
    mojang_id?: StringNullableFilter<"Nlogin"> | string | null
    bedrock_id?: StringNullableFilter<"Nlogin"> | string | null
    password?: StringNullableFilter<"Nlogin"> | string | null
    ip?: StringNullableFilter<"Nlogin"> | string | null
    last_seen?: DateTimeFilter<"Nlogin"> | Date | string
    creation_date?: DateTimeFilter<"Nlogin"> | Date | string
    email?: StringNullableFilter<"Nlogin"> | string | null
    discord?: StringNullableFilter<"Nlogin"> | string | null
    settings?: StringNullableFilter<"Nlogin"> | string | null
  }

  export type NloginOrderByWithRelationInput = {
    id?: SortOrder
    last_name?: SortOrder
    unique_id?: SortOrderInput | SortOrder
    mojang_id?: SortOrderInput | SortOrder
    bedrock_id?: SortOrderInput | SortOrder
    password?: SortOrderInput | SortOrder
    ip?: SortOrderInput | SortOrder
    last_seen?: SortOrder
    creation_date?: SortOrder
    email?: SortOrderInput | SortOrder
    discord?: SortOrderInput | SortOrder
    settings?: SortOrderInput | SortOrder
    _relevance?: NloginOrderByRelevanceInput
  }

  export type NloginWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    unique_id?: string
    mojang_id?: string
    bedrock_id?: string
    AND?: NloginWhereInput | NloginWhereInput[]
    OR?: NloginWhereInput[]
    NOT?: NloginWhereInput | NloginWhereInput[]
    last_name?: StringFilter<"Nlogin"> | string
    password?: StringNullableFilter<"Nlogin"> | string | null
    ip?: StringNullableFilter<"Nlogin"> | string | null
    last_seen?: DateTimeFilter<"Nlogin"> | Date | string
    creation_date?: DateTimeFilter<"Nlogin"> | Date | string
    email?: StringNullableFilter<"Nlogin"> | string | null
    discord?: StringNullableFilter<"Nlogin"> | string | null
    settings?: StringNullableFilter<"Nlogin"> | string | null
  }, "id" | "unique_id" | "mojang_id" | "bedrock_id">

  export type NloginOrderByWithAggregationInput = {
    id?: SortOrder
    last_name?: SortOrder
    unique_id?: SortOrderInput | SortOrder
    mojang_id?: SortOrderInput | SortOrder
    bedrock_id?: SortOrderInput | SortOrder
    password?: SortOrderInput | SortOrder
    ip?: SortOrderInput | SortOrder
    last_seen?: SortOrder
    creation_date?: SortOrder
    email?: SortOrderInput | SortOrder
    discord?: SortOrderInput | SortOrder
    settings?: SortOrderInput | SortOrder
    _count?: NloginCountOrderByAggregateInput
    _avg?: NloginAvgOrderByAggregateInput
    _max?: NloginMaxOrderByAggregateInput
    _min?: NloginMinOrderByAggregateInput
    _sum?: NloginSumOrderByAggregateInput
  }

  export type NloginScalarWhereWithAggregatesInput = {
    AND?: NloginScalarWhereWithAggregatesInput | NloginScalarWhereWithAggregatesInput[]
    OR?: NloginScalarWhereWithAggregatesInput[]
    NOT?: NloginScalarWhereWithAggregatesInput | NloginScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Nlogin"> | number
    last_name?: StringWithAggregatesFilter<"Nlogin"> | string
    unique_id?: StringNullableWithAggregatesFilter<"Nlogin"> | string | null
    mojang_id?: StringNullableWithAggregatesFilter<"Nlogin"> | string | null
    bedrock_id?: StringNullableWithAggregatesFilter<"Nlogin"> | string | null
    password?: StringNullableWithAggregatesFilter<"Nlogin"> | string | null
    ip?: StringNullableWithAggregatesFilter<"Nlogin"> | string | null
    last_seen?: DateTimeWithAggregatesFilter<"Nlogin"> | Date | string
    creation_date?: DateTimeWithAggregatesFilter<"Nlogin"> | Date | string
    email?: StringNullableWithAggregatesFilter<"Nlogin"> | string | null
    discord?: StringNullableWithAggregatesFilter<"Nlogin"> | string | null
    settings?: StringNullableWithAggregatesFilter<"Nlogin"> | string | null
  }

  export type NloginCreateInput = {
    last_name: string
    unique_id?: string | null
    mojang_id?: string | null
    bedrock_id?: string | null
    password?: string | null
    ip?: string | null
    last_seen?: Date | string
    creation_date?: Date | string
    email?: string | null
    discord?: string | null
    settings?: string | null
  }

  export type NloginUncheckedCreateInput = {
    id?: number
    last_name: string
    unique_id?: string | null
    mojang_id?: string | null
    bedrock_id?: string | null
    password?: string | null
    ip?: string | null
    last_seen?: Date | string
    creation_date?: Date | string
    email?: string | null
    discord?: string | null
    settings?: string | null
  }

  export type NloginUpdateInput = {
    last_name?: StringFieldUpdateOperationsInput | string
    unique_id?: NullableStringFieldUpdateOperationsInput | string | null
    mojang_id?: NullableStringFieldUpdateOperationsInput | string | null
    bedrock_id?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    ip?: NullableStringFieldUpdateOperationsInput | string | null
    last_seen?: DateTimeFieldUpdateOperationsInput | Date | string
    creation_date?: DateTimeFieldUpdateOperationsInput | Date | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    discord?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type NloginUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    last_name?: StringFieldUpdateOperationsInput | string
    unique_id?: NullableStringFieldUpdateOperationsInput | string | null
    mojang_id?: NullableStringFieldUpdateOperationsInput | string | null
    bedrock_id?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    ip?: NullableStringFieldUpdateOperationsInput | string | null
    last_seen?: DateTimeFieldUpdateOperationsInput | Date | string
    creation_date?: DateTimeFieldUpdateOperationsInput | Date | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    discord?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type NloginCreateManyInput = {
    id?: number
    last_name: string
    unique_id?: string | null
    mojang_id?: string | null
    bedrock_id?: string | null
    password?: string | null
    ip?: string | null
    last_seen?: Date | string
    creation_date?: Date | string
    email?: string | null
    discord?: string | null
    settings?: string | null
  }

  export type NloginUpdateManyMutationInput = {
    last_name?: StringFieldUpdateOperationsInput | string
    unique_id?: NullableStringFieldUpdateOperationsInput | string | null
    mojang_id?: NullableStringFieldUpdateOperationsInput | string | null
    bedrock_id?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    ip?: NullableStringFieldUpdateOperationsInput | string | null
    last_seen?: DateTimeFieldUpdateOperationsInput | Date | string
    creation_date?: DateTimeFieldUpdateOperationsInput | Date | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    discord?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type NloginUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    last_name?: StringFieldUpdateOperationsInput | string
    unique_id?: NullableStringFieldUpdateOperationsInput | string | null
    mojang_id?: NullableStringFieldUpdateOperationsInput | string | null
    bedrock_id?: NullableStringFieldUpdateOperationsInput | string | null
    password?: NullableStringFieldUpdateOperationsInput | string | null
    ip?: NullableStringFieldUpdateOperationsInput | string | null
    last_seen?: DateTimeFieldUpdateOperationsInput | Date | string
    creation_date?: DateTimeFieldUpdateOperationsInput | Date | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    discord?: NullableStringFieldUpdateOperationsInput | string | null
    settings?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type NloginOrderByRelevanceInput = {
    fields: NloginOrderByRelevanceFieldEnum | NloginOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type NloginCountOrderByAggregateInput = {
    id?: SortOrder
    last_name?: SortOrder
    unique_id?: SortOrder
    mojang_id?: SortOrder
    bedrock_id?: SortOrder
    password?: SortOrder
    ip?: SortOrder
    last_seen?: SortOrder
    creation_date?: SortOrder
    email?: SortOrder
    discord?: SortOrder
    settings?: SortOrder
  }

  export type NloginAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type NloginMaxOrderByAggregateInput = {
    id?: SortOrder
    last_name?: SortOrder
    unique_id?: SortOrder
    mojang_id?: SortOrder
    bedrock_id?: SortOrder
    password?: SortOrder
    ip?: SortOrder
    last_seen?: SortOrder
    creation_date?: SortOrder
    email?: SortOrder
    discord?: SortOrder
    settings?: SortOrder
  }

  export type NloginMinOrderByAggregateInput = {
    id?: SortOrder
    last_name?: SortOrder
    unique_id?: SortOrder
    mojang_id?: SortOrder
    bedrock_id?: SortOrder
    password?: SortOrder
    ip?: SortOrder
    last_seen?: SortOrder
    creation_date?: SortOrder
    email?: SortOrder
    discord?: SortOrder
    settings?: SortOrder
  }

  export type NloginSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}