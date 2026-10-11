import { dataSource } from '@/services/datasource'
import type { CostCategory } from '@/types'
import { DEFAULT_COST_CATEGORIES } from '@/utils/constants'

export const categoriesService = {
  /** Active cost categories from the backend, falling back to the defaults
   * when the backend is unreachable or not yet upgraded. */
  async list(): Promise<string[]> {
    try {
      const result = await dataSource.listCategories()
      return result.length > 0 ? result : [...DEFAULT_COST_CATEGORIES]
    } catch {
      return [...DEFAULT_COST_CATEGORIES]
    }
  },

  create(name: string, actor: string): Promise<CostCategory> {
    return dataSource.createCategory(name, actor)
  },

  remove(name: string): Promise<void> {
    return dataSource.deleteCategory(name)
  },
}