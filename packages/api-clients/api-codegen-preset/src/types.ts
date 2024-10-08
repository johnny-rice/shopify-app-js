export enum ApiType {
  Admin = 'Admin',
  Storefront = 'Storefront',
  Customer = 'Customer',
}

export interface ShopifyApiPresetConfig {
  apiType: ApiType;
  module?: string;
}

export interface ShopifyApiProjectOptions {
  apiType: ApiType;
  apiVersion?: string;
  outputDir?: string;
  documents?: string[];
  module?: string;
  declarations?: boolean;
  apiKey?: string;
}

export type ShopifyApiTypesOptions = ShopifyApiProjectOptions;
