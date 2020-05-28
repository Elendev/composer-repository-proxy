export interface packagesJson {
  packages: [],
  notify?: string,
  "notify-batch"?: string,
  "providers-url"?: string,
  "metadata-url"?: string,
  "search"?: string,
  "providers-api"?: string,
  "provider-includes": providers
}

export interface providerJson {
  packages?: {
    [key: string]: any
  }
  providers: providers
}

export interface providers {
  [key: string]: {
    sha256
  }
}
