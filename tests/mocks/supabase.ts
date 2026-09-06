import { vi } from 'vitest'

export type TableRow = Record<string, unknown>

export interface MockSupabaseTableData {
  [table: string]: TableRow[]
}

export interface MockQueryBuilder {
  select: (cols?: string) => MockQueryBuilder
  insert: (rows: TableRow | TableRow[]) => MockQueryBuilder
  update: (values: TableRow) => MockQueryBuilder
  delete: () => MockQueryBuilder
  eq: (column: string, value: unknown) => MockQueryBuilder
  order: () => MockQueryBuilder
  limit: (n: number) => MockQueryBuilder
  single: () => Promise<{ data: TableRow | null; error: null }>
  then: <TResult1 = { data: TableRow | TableRow[] | null; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: TableRow | TableRow[] | null; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) => Promise<TResult1 | TResult2>
}

export function createMockSupabaseClient(initialData: MockSupabaseTableData = {}) {
  const dataStore: MockSupabaseTableData = { ...initialData }

  const from = vi.fn((table: string) => {
    if (!dataStore[table]) {
      dataStore[table] = []
    }

    let filterFn = (_row: TableRow) => true
    let isSingle = false
    let pendingInsert: TableRow[] | null = null
    let pendingUpdate: TableRow | null = null
    let pendingDelete = false

    function executeQuery(singleResult: boolean) {
      if (pendingUpdate) {
        const matching = dataStore[table].filter(filterFn)
        matching.forEach((row) => Object.assign(row, pendingUpdate))
        return { data: singleResult ? matching[0] || null : matching, error: null }
      }

      if (pendingDelete) {
        dataStore[table] = dataStore[table].filter((row) => !filterFn(row))
        return { data: null, error: null }
      }

      if (pendingInsert) {
        const result = singleResult ? pendingInsert[0] : pendingInsert
        return { data: result, error: null }
      }

      const filtered = dataStore[table].filter(filterFn)
      return {
        data: singleResult ? filtered[0] || null : filtered,
        error: null,
      }
    }

    const queryBuilder: MockQueryBuilder = {
      select: vi.fn(() => queryBuilder),
      insert: vi.fn((rows: TableRow | TableRow[]) => {
        const rowsArray = Array.isArray(rows) ? rows : [rows]
        const inserted = rowsArray.map((r, i) => ({
          id: (r.id as string) || `mock-id-${table}-${Date.now()}-${i}`,
          created_at: (r.created_at as string) || new Date().toISOString(),
          ...r,
        }))
        dataStore[table].push(...inserted)
        pendingInsert = inserted
        return queryBuilder
      }),
      update: vi.fn((values: TableRow) => {
        pendingUpdate = values
        return queryBuilder
      }),
      delete: vi.fn(() => {
        pendingDelete = true
        return queryBuilder
      }),
      eq: vi.fn((column: string, value: unknown) => {
        const prevFilter = filterFn
        filterFn = (row: TableRow) => prevFilter(row) && row[column] === value
        return queryBuilder
      }),
      order: vi.fn(() => queryBuilder),
      limit: vi.fn((n: number) => {
        const prevFilter = filterFn
        let count = 0
        filterFn = (row: TableRow) => {
          if (prevFilter(row) && count < n) {
            count++
            return true
          }
          return false
        }
        return queryBuilder
      }),
      single: vi.fn(() => {
        isSingle = true
        return Promise.resolve(executeQuery(true) as { data: TableRow | null; error: null })
      }),
      then: (onfulfilled, onrejected) => {
        const result = executeQuery(isSingle)
        return Promise.resolve(result).then(onfulfilled, onrejected)
      },
    }

    return queryBuilder
  })

  return {
    from,
    _dataStore: dataStore,
  }
}
