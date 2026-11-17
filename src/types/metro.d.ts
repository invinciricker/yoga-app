/**
 * Tells TypeScript about `require.context`, a feature of the bundler (Metro) that Expo switches on:
 * "give me every file of this folder whose name matches". Used by src/content/fallback.ts.
 */
declare namespace NodeJS {
  interface Require {
    context(
      folder: string,
      recursive?: boolean,
      filter?: RegExp,
    ): { keys(): string[]; (id: string): unknown };
  }
}
