import { walkAndReplace } from '../../utils/JsonWalker';
import { FragmentMeta } from '../model/FragmentMeta';
import { ContentMeta } from '../model/ContentMeta';
import { CommonContentClientConfig } from '../../config/CommonContentClientConfig';
import { Image } from '../../media/Image';
import { Video } from '../../media/Video';
import { ContentReference } from '../model/ContentReference';
import { RequriedContentReference } from '../../content/model/ContentReference';

/**
 * @hidden
 * Function that converts a fragment of content into a hydrated model class.
 * This function should return nothing if the fragment cannot be hydrated
 * by this function.
 */
export type ContentMapperFn = (fragment: any) => any;

/**
 * @hidden
 * ContentMapper provides functionality to convert simple JSON content into hydrated model classes
 * with helper functions. If a mapper is not defined for a schema it will remain as plain JSON.
 */
export class ContentMapper {
  protected mappers: ContentMapperFn[] = [];

  constructor(private readonly config: CommonContentClientConfig) {
    this.registerBuiltInMappers();
  }

  /**
   * Registers a custom model / fn to hydrate a specific schema
   * @param schema JSON schema ID or Regex that matches against the JSON schema ID
   * @param fn Model Class or Function that can convert the schema
   */
  addSchema(schema: string | RegExp, fn: ContentMapperFn): void {
    if (typeof schema === 'string') {
      this.addCustomMapper((fragment) => {
        if (fragment._meta.schema === schema) {
          return fn(fragment);
        }
      });
    } else {
      this.addCustomMapper((fragment) => {
        if (schema.test(fragment._meta.schema)) {
          return fn(fragment);
        }
      });
    }
  }

  /**
   * Registers a custom function to hydrate content fragments
   * @param fn Mapper function
   */
  addCustomMapper(fn: ContentMapperFn): void {
    this.mappers.push(fn);
  }

  /**
   * Converts the provided content into hydrated model classes
   * @param content Content to convert
   */
  toMappedContent(content: Record<string, any>): any {
    return walkAndReplace(content, {
      afterWalk: (node) => {
        if (FragmentMeta.isFragment(node)) {
          return this.mapFragment(node);
        }
        return node;
      },
    });
  }

  /**
   * Converts a single fragment using the registered mappers
   * @param fragment Fragment to convert
   */
  protected mapFragment(
    fragment: RequriedContentReference<Record<string, unknown>>
  ): any {
    for (const mapper of this.mappers) {
      const result = mapper(fragment);
      if (result) {
        return result;
      }
    }
    return fragment;
  }

  /**
   * Registers built in mappers
   */
  protected registerBuiltInMappers(): void {
    this.addCustomMapper(this.convertContentReference.bind(this));
    this.addCustomMapper(this.convertContentMeta.bind(this));
    this.addCustomMapper(this.convertImage.bind(this));
    this.addCustomMapper(this.convertVideo.bind(this));
  }

  /**
   * Converts _meta inside Content Items into a ContentMeta instance
   * @param fragment
   */
  protected convertContentMeta(
    fragment: RequriedContentReference<Record<string, unknown>>
  ): any {
    if (ContentMeta.isContentBody(fragment)) {
      return {
        ...fragment,
        _meta: new ContentMeta(fragment._meta),
      };
    }
  }

  /**
   * Converts content-link into an Content reference class instance
   * @param fragment
   */
  protected convertContentReference(
    fragment: RequriedContentReference<Record<string, unknown>>
  ): any {
    if (ContentReference.isContentReference(fragment)) {
      const result = new ContentReference(fragment);
      return result;
    }
  }

  /**
   * Converts image-link into an Image class instance
   * @param fragment
   */
  protected convertImage(
    fragment: RequriedContentReference<Record<string, unknown>>
  ): any {
    if (Image.isImage(fragment)) {
      const result = new Image(fragment, this.config);
      return result;
    }
  }

  /**
   * Converts image-link into an Image class instance
   * @param fragment
   */
  protected convertVideo(
    fragment: RequriedContentReference<Record<string, unknown>>
  ): any {
    if (Video.isVideo(fragment)) {
      const result = new Video(fragment, this.config);
      return result;
    }
  }
}
