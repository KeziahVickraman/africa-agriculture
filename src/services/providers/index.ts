import { DataProvider } from './types.ts';
import { AfricaProvider } from './AfricaProvider.ts';
import { IndiaProvider } from './IndiaProvider.ts';

export * from './types.ts';
export * from './AfricaProvider.ts';
export * from './IndiaProvider.ts';

export const PROVIDERS: Record<'africa' | 'india', DataProvider> = {
  africa: new AfricaProvider(),
  india: new IndiaProvider(),
};

export function getProvider(region: 'africa' | 'india'): DataProvider {
  return PROVIDERS[region] || PROVIDERS.africa;
}
