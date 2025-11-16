export type {
  Product,
  ProductMetadata,
  ImagePlaceholderMap,
  MediaAssetInput,
  ProductMutationInput,
  ProductPriorityUpdate
} from './products/types'

export {
  canUseSupabase,
  clearProductCaches
} from './products/cache'

export {
  getAllProductIds,
  getProductData,
  getAllProducts,
  getProductsByTag,
  getProductsByType,
  invalidateProductDataCache
} from './products/repository'

export {
  updateProductPriorities,
  createProductRecord,
  updateProductRecord,
  deleteProductRecord,
  replaceProductMediaAssets,
  updateProductTags
} from './products/mutations'
