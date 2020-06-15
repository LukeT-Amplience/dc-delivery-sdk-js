import { AxiosAdapter } from 'axios';

export interface ContentClientConfigV1 extends CommonContentClientConfig {
  /**
   * Account to retrieve content from.
   */
  account: string;
}

export interface ContentClientConfigV2 extends CommonContentClientConfig {
  /**
   * Hub name to retrieve content from.
   */
  hubName: string;
}

/**
 * Configuration settings for Content Delivery API client. You can optionally
 * override these values with environment specific values.
 */
export interface CommonContentClientConfig {
  /**
   * Allows custom handling of requests which makes testing and supporting non-standard environments easier.
   */
  adaptor?: AxiosAdapter;

  /**
   * If set, the SDK will request content and media from the staging environment host name specified.
   * This will override any values set for “baseUrl”, “mediaHost” and “secureMediaHost”.
   */
  stagingEnvironment?: string;

  /**
   * If set, the SDK will request content using the locale settings provided.
   * If your content contains any localized fields, this will cause a single
   * locale to be returned rather than the complete list of values.
   */
  locale?: string;

  /**
   * Allows users with custom hostnames to override the hostname used when constructing media URLs.
   * E.g. images.mywebsite.com.
   */
  mediaHost?: string;

  /**
   * Allows users with custom hostnames to override the hostname used when constructing secure media URLs.
   * E.g. images.mywebsite.com.
   */
  secureMediaHost?: string;

  /**
   * Override for the content delivery API base URL. If “stagingEnvironment” is set the sdk will automatically
   * update the baseUrl to load content from the virtual staging environment.
   */
  baseUrl?: string;
}
