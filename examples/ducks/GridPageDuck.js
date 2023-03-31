import { DuckMap } from 'vue-saga-duck';
import GridDuck from './GridDuck';
import { call, fork, put, select } from 'redux-saga/effects'
import { takeLatest, runAndTakeLatest, delay } from 'redux-saga-catch'

const OperationType = {
    /** 无目标操作，或目标不是列表项的操作 */
    NO_TARGET: 'NO_TARGET',
    /** 单目标操作，action payload为操作对象 */
    SINGLE: 'SINGLE',
    /** 批量操作，从Grid selection获取操作对象 */
    MULTI: 'MULTI'
}

export default class GridPageDuck extends DuckMap {
    get recordKey() {
        return 'id'
    }
    
    get Grid() {
        const duck = this
        return class extends GridDuck {
          get buffer() {
            return duck.buffer
          }
          get recordKey() {
            return duck.recordKey
          }
          getData(me = this, filter) {
            return duck.getData(filter)
          }
        }
    }
    get quickTypes() {
        const Types = {
            'PAGINATE': 1,
            'INPUT_KEYWORD': 1,
            'SEARCH': 1,
            'RELOAD': 1,
            'EXPORT': 1,
            'EXPORT_DONE': 1,
            'EXPORT_CAM_FAIL': 1,
            /** 设置当前能展示的完整列 */
            'SET_FULL_COLUMNS': 1,
            /** 设置用户自定义列 */
            'SET_CUSTOM_FIELDS': 1
        }
        return {
          ...super.quickTypes,
          ...Types
        }
    }
    get reducers() {
        const { types, defaultPageSize, maxPageSize } = this
        return {
          ...super.reducers,
          page: (state = 1, action) => {
            switch (action.type) {
              case types.PAGINATE:
                return action.payload.page || state
              default:
                return state
            }
          },
          count: (
            state = Math.min(defaultPageSize, maxPageSize),
            action
          ) => {
            switch (action.type) {
              case types.PAGINATE:
                return action.payload.count || state
              default:
                return state
            }
          },
          pendingKeyword: (state = '', action) => {
            switch (action.type) {
              case types.INPUT_KEYWORD:
              case types.SEARCH:
                return action.payload
              default:
                return state
            }
          },
        //   keyword: reduceFromPayload<string>(types.SEARCH, ''),
        //   fullColumns: reduceFromPayload<this['Column'][]>(
        //     types.SET_FULL_COLUMNS,
        //     []
        //   ),
        //   customFields: reduceFromPayload<Identifiable[]>(
        //     types.SET_CUSTOM_FIELDS,
        //     []
        //   )
        }
    }

    get creators() {
        const { types } = this
        return {
          ...super.creators,
          paginate: (page, count) => {
            const payload = { page, count }
            return {
              type: types.PAGINATE,
              payload
            }
          },
        //   inputKeyword: createToPayload<string>(types.INPUT_KEYWORD),
          search: (keyword) => {
            // 进行前后空格去除
            if (this.autoTrimKeyword && typeof keyword === 'string') {
              keyword = keyword.trim()
            }
            return {
              type: types.SEARCH,
              payload: keyword
            }
          },
          /** 清空搜索条件，可重写 */
          clearSearchCondition: () => this.creators.search(''),
          reload: () => ({
            type: types.RELOAD
          }),
        //   setFullColumns: createToPayload<this['Column'][]>(types.SET_FULL_COLUMNS),
        //   setCustomFields: createToPayload<Identifiable[]>(types.SET_CUSTOM_FIELDS)
        }
    }

    get rawSelectors() {
        return {
          ...super.rawSelectors,
          filter: (state) => ({
            // regionId: state.region.id,
            page: state.page,
            count: state.count,
            keyword: state.keyword
          }),
          page: ({ page }) => page,
          count: ({ count }) => count,
          pendingKeyword: (state) => state.pendingKeyword,
          keyword: ({ keyword }) => keyword,
          /**
           * 搜索描述语xxx，展示在Grid的上方（搜索"xxx"，找到N条结果。返回原列表）。
           * 如果为空则默认使用filter.keyword，可重写
           */
          searchCondition: (state) => '',
          columnOptions: (state) => ({}),
          /** 供FieldsManager使用 */
          fields: (state) => {
            const fullColumns = state.fullColumns
    
            return fullColumns
              .filter(x => x.supported !== false)
              .map((c) => ({
                id: c.key,
                headTitle: typeof c.header === 'function' ? c.header(c) : c.header,
                required: c.required,
                defaults: c.required,
                hide: c.hide
              }))
          },
          columns: ({ fullColumns, customFields }) => {
            const set = new Set()
    
            customFields.forEach(f => {
              set.add(f.id)
            })
    
            return fullColumns.filter(c => {
              return (
                c.supported !== false &&
                (c.required || !customFields.length || set.has(c.key))
              )
            })
          }
        }
    }
    get quickDucks() {
        return {
          ...super.quickDucks,
          grid: this.Grid
        }
    }

    *saga() {
        yield* super.saga()
        yield* this.sagaGridPageMain()
    }

    get watchTypes() {
        const { types } = this
        return [types.SEARCH, types.RELOAD]
    }

    get waitRouteInitialized() {
        return false
    }

    get resetPageTypes() {
        return this.watchTypes
    }

    getData(filter) {}

    get GetDataParams() {
        return null
    }

    get GetDataResult() {
        return null
    }
    
    get initialFetch() {
        return true
    }

    get minPageSize() {
        return 5
    }

    
    get pageSizeInterval() {
        return 5
    }

    get maxPageSize() {
        return 100
    }

     /** 默认每页条数 */
    get defaultPageSize() {
        return 20
    }

    get autoTrimKeyword() {
        return true
    }

    getColumns(duck, options) {
        return []
    }

    get columnsWatchTypes() {
        const { ducks } = this
        return [ducks.grid.types.FETCH_DONE]
    }


    *sagaGridPageMain(duck = this) {
        yield* this.waitGridPageReady()

        yield* this.watchLoadData()

        yield* this.watchResetPagination()

        yield* this.sagaOperationsWatch()
        
    }

    *waitGridPageReady() {

    }
    *getSearchCondition() {
        return this.selectors.searchCondition(yield select())
    }

    *getFilter({ selectors }) {
        return yield select(selectors.filter)
    }

    *loadData() {
        const duck = this
        const {
          selectors,
          ducks: { grid }
        } = duck
        const filter = yield call([duck, duck.getFilter], duck)
        
        // 以前是异步的，现在改为同步后，CKafka列表的自动刷新会有问题 --- 已同步修改
        const dataFetched = yield* grid.sagaManualFetch(
          filter,
          yield* this.getSearchCondition()
        )
    
        if (!dataFetched) {
          return dataFetched
        }
    
        return dataFetched
    }

    *watchLoadData()  {
        const duck = this
        const { types, watchTypes, initialFetch } = duck
    
        const helper = initialFetch ? runAndTakeLatest : takeLatest
    
        yield helper([types.PAGINATE, watchTypes], function* reloadOnChange() {
          yield* duck.loadData()
        })
    }

    *watchResetPagination() {
        const duck = this
        const { selectors, creators, resetPageTypes } = duck
        yield takeLatest(resetPageTypes, function* resetPage(action) {
          // URL同步过来的无视
          if (action.fromRoute) {
            return
          }
          const page = yield select(selectors.page)
          if (page != 1) {
            yield put(creators.paginate(1))
          }
        })
    }

    get operations() {
        return []
    }

    *sagaOperationsWatch() {
        const { creators, ducks, operations } = this
        for (const operation of operations) {
          let wappedSaga;
          switch (operation.type) {
            // 无目标操作
            case OperationType.NO_TARGET:
              wappedSaga = operation.fn
              break
            // 单条操作映射
            case OperationType.SINGLE:
              wappedSaga = function* (action) {
                const { payload } = action
                return yield operation.fn(payload, action)
              }
              break
            // 批量操作映射
            case OperationType.MULTI:
              wappedSaga = function* (action) {
                const instance = action.payload
                let instances;
                if (instance) {
                  instances = [instance]
                } else {
                  instances = ducks.grid.selectors.selection(yield select())
                }
                return yield operation.fn(instances, action)
              }
              break
          }
          if (!wappedSaga) {
            continue
          }
          yield takeLatest(operation.watch, function* (action) {
            try {
              const success = yield wappedSaga(action)
              if (success && operation.reload !== false) {
                yield put(creators.reload())
              }
              if (success && operation.successTip) {
                // tips.success(operation.successTip)
              }
              if (success && operation.successCb) {
                yield operation.successCb()
              }
            } catch (e) {
            //   tips.error(getErrorMessage(e))
            }
          })
        }
    }


    

    
    
    

    
    
    
    
    
    

    

    
    
    
    
    
    
    
    
    
    

    
    

    

    

    
    
}