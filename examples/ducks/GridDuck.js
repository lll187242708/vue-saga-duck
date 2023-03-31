import { DuckMap } from 'vue-saga-duck'
import { put, select, call, all, fork } from 'redux-saga/effects'
import { takeLatest, delay } from 'redux-saga-catch'

export default class GridDuck extends DuckMap {
    /**
     * 每条记录的ID属性，用于Table组件渲染时的key，以及选择功能的索引。默认为 "id"
     */
    get recordKey() {
        return 'id'
    }
    get quickTypes() {
        const Types = {
            'FETCH': 1,
            'FETCH_DONE': 1,
            'FETCH_FAIL': 1,
            /** 重置请求状态 */
            RESET: 1,
            'UPDATE': 1,
            'BATCH_UPDATE': 1,
            'SELECT': 1,
            SET_SEARCH_CONDITION: 1,
        }
        return {
          ...super.quickTypes,
          ...Types,
        }
    }
    get reducers() {
        const { types } = this
        return {
          ...super.reducers,
          list: (state = [], action) => {
            switch (action.type) {
              case types.FETCH_DONE:
                return action.payload.list
              case types.FETCH_FAIL:
                return []
              case types.BATCH_UPDATE:
                return state.map((item, index) => {
                  const updates = action.list[index]
                  if (!updates) {
                    return item
                  }
                  return Object.assign({}, item, updates)
                })
              case types.UPDATE: {
                // 单条更新
                const list = state.slice(0)
                let index = +action.index
                // index也可以传对象，但必须是原样的
                if (isNaN(index)) {
                  index = list.indexOf(action.index)
                }
                list[index] = Object.assign({}, list[index], action.data)
                return list
              }
              case types.RESET:
                return []
              default:
                return state
            }
          },
          totalCount: (state = 0, action) => {
            switch (action.type) {
              case types.FETCH_DONE:
                return action.payload.totalCount
              case types.FETCH_FAIL:
              case types.RESET:
                return 0
              default:
                return state
            }
          },
          error: (state = null, action) => {
            switch (action.type) {
              case types.FETCH_DONE:
              case types.RESET:
                return null
              case types.FETCH_FAIL:
                return action.payload
              default:
                return state
            }
          },
          loading: (state = false, action) => {
            switch (action.type) {
              case types.FETCH:
                return true
              case types.FETCH_DONE:
              case types.FETCH_FAIL:
              case types.RESET:
                return false
              default:
                return state
            }
          },
          filter: (state = null, action) => {
            switch (action.type) {
                case types.FETCH:
                    return action.payload;
                default:
                    return state
            }
          },
          selection: (state = null, action) => {
            switch (action.type) {
                case types.SELECT:
                    return action.payload;
                default:
                    return state
            }
          },
          searchCondition: (state = '', action) => {
            switch (action.type) {
                case types.SET_SEARCH_CONDITION:
                    return action.payload;
                default:
                    return state
            }
          }
        }
    }
    get creators() {
        const { types } = this
        return {
          ...super.creators,
          /** 按指定过滤条件加载数据 */
          fetch: (filter) => ({
            type: types.FETCH,
            payload: filter,
          }),
          /** 重置加载状态 */
          reset: () => ({ type: types.RESET }),
          /** 更新指定行数据 */
          update: (index, data) => ({
            type: types.UPDATE,
            index,
            data,
          }),
          /** 批量更新 */
          updateList: (list) => ({
            type: types.BATCH_UPDATE,
            list,
          }),
          /** 设置选中项 */
          select: (list) => ({ type: types.SELECT, payload: list }),
          /** 设置搜索条件（在列表内容上方展示，会替代filter.keyword） */
          setSearchCondition: (list) => ({ type: types. SET_SEARCH_CONDITION})
        //   setSearchCondition: createToPayload<string>(types.SET_SEARCH_CONDITION),
        }
    }

    get rawSelectors() {
        const duck = this
        return {
          ...super.rawSelectors,
          /** 供SmartTip兼容使用 */
          fetcher: (state) => ({
            fetchState: state.error
              ? FetchState.Failed
              : state.loading
              ? FetchState.Fetching
              : FetchState.Ready,
            loading: state.loading,
            data: {
              recordCount: state.totalCount,
            },
          }),
          /** 供SmartTip兼容使用 */
          query: (state) => ({
            search: duck.rawSelectors.searchCondition(state),
          }),
          /** 展示在列表头部的搜索条件，例如： xxxx => 搜索 “xxxx”，找到 1 条结果 返回原列表 */
          searchCondition: (state) => state.searchCondition || (state.filter && state.filter.keyword),
          filter: (state) => state.filter,
          error: (state) => state.error,
          list: ({ list }) => list,
          selection: (state) => state.selection,
          totalCount: ({ totalCount }) => totalCount,
          loading: (state) => state.loading,
        }
    }
    *saga() {
        yield* super.saga()
        yield fork([this, this.sagaMain])
    }
    get buffer() {
        return 100
    }
    *sagaMain(duck = this) {
        const { types } = duck
    
        yield takeLatest(types.FETCH, function* (action) {
          if (action.manual) {
            return
          }
          yield* duck.sagaFetch()
        })
    
        yield* duck.sagaWatchSelection()
    }
    *sagaManualFetch(filter, searchDesc = '') {
        const { types, selector } = this
        yield put({
          type: types.FETCH,
          payload: filter,
          manual: true,
        })
        // 当searchCondition与现有的不符时就更新
        const { searchCondition } = selector(yield select())
        if (searchDesc !== searchCondition) {
          yield put(this.creators.setSearchCondition(searchDesc))
        }
    
        return yield* this.sagaFetch()
    }
    *sagaFetch() {
        const duck = this
        const { selectors, options, types, creators, buffer, getData } = duck
        // 缓冲
        yield call(delay, buffer || 100)
        const filter = yield select(selectors.filter)
    
        let dataFetched = false
        try {
          // 加载数据
          let payload = yield getData(duck, filter, function* progressiveUpdate(
            payload
          ) {
            yield put({
              type: types.FETCH_DONE,
              payload,
            })
            dataFetched = true
          })
          // 展示
          yield put({
            type: types.FETCH_DONE,
            payload,
          })
          dataFetched = true
        } catch (e) {
          if (!dataFetched) {
            yield put({
              type: types.FETCH_FAIL,
              payload: e,
            })
          }
          console.error(e)
        }
        return dataFetched
    }
    getData(me, filter, progressiveUpdate) {}

    *sagaWatchSelection() {
        const { types, selector, creators, recordKey } = this
        // 当列表更新时，更新选中状态引用
        yield takeLatest(
          [types.FETCH_DONE, types.UPDATE, types.BATCH_UPDATE],
          function* () {
            const { selection, list } = selector(yield select())
            if (!selection || !selection.length) {
              return
            }
            const map = (list || []).reduce((map, o) => {
              map[o[recordKey]] = o
              return map
            }, {})
            const newSelection = selection
              .map((x) => map[x[recordKey]])
              .filter((x) => x)
            yield put(creators.select(newSelection))
          }
        )
    }
}