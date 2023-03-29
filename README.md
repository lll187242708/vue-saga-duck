# vue-saga-duck

### 解决问题
主要是解决了 Vue 模版化，很难服用逻辑问题。 Vue 中想要抽离逻辑复用，需要借助 mixin 混入。

mixin 混入存在问题：
1. 如果是页面级别的逻辑，在 Vue 中不好抽离出来，抽离出来也需要靠 mixin 混入，逻辑来源不明确。
2. 如果是小模块的逻辑复用，需要抽离成单组件，或者使用 mixin 混入，比较混乱。

我们希望以 class 继承的形式来解决逻辑复用。以及借助组合的形式来达到复用逻辑，不会造成混乱

# example
Run command:
```sh
npm npm serve
```

# usage
## install
```sh
npm i vue-saga-duck -S
```

## single duck
```js
import { Duck } from "vue-saga-duck";
import { takeEvery, call, put, select } from "redux-saga/effects";
import { delay } from "redux-saga";

class SingleDuck extends Duck {
  get quickTypes() {
    return {
      ...super.quickTypes,
      INCREMENT: 1,
      INCREMENT_ASYNC: 1
    };
  }
  get reducers() {
    const { types } = this;
    return {
      ...super.reducers,
      count: (state = 0, action) => {
        switch (action.type) {
          case types.INCREMENT:
            return state + 1;
          default:
            return state;
        }
      }
    };
  }
  *saga() {
    yield* super.saga();
    const { types, selector } = this;
    yield takeEvery(types.INCREMENT_ASYNC, function*() {
      yield call(delay, 1000);
      // select state of this duck
      const { count } = selector(yield select());
      yield put({type: types.INCREMENT});
    });
  }
}
```

## extend duck
```js
class ExtendedDuck extends SingleDuck {
  get quickTypes(){
    return {
      ...super.quickTypes,
      MORE: 1
    }
  }
  get reducers(){
    return {
      ...super.reducers,
      more: (state, action) => 1
    }
  }
  get rawSelectors(){
    return {
      ...super.rawSelectors,
      more(state){
        return state.more
      }
    }
  }
  get creators(){
    const { types } = this
    return {
      ...super.creators,
      more(){
        return {
          type: types.MORE
        }
      }
    }
  }
  *saga(){
    yield* super.saga()
    const { types, selector, selectors, creators } = this
    yield take([types.INCREMENT, types.MORE])
    const { count, more } = selector(yield select())
    const _more = selectors.more(yield select())
    yield put(creators.more())
  }
}
```

## compose ducks
```js
import { ComposableDuck } from "vue-saga-duck";

class ComposedDuck extends ComposableDuck {
  get quickTypes() {
    return {
      ...super.quickTypes,
      PARENT: 1
    };
  }
  get quickDucks() {
    return {
      ...super.quickDucks,
      duck1: SingleDuck,
      duck2: ExtendedDuck,
      duck3: ExtendedDuck
    };
  }
  *saga() {
    yield* super.saga();
    const {
      types,
      selector,
      ducks: { duck1, duck2, duck3 }
    } = this;
    yield takeEvery(types.PARENT, function*() {
      yield put({ type: duck1.types.INCREMENT });
      yield put(duck2.creators.more());
      yield put(duck3.creators.more());
    });
    const state = selector(yield select());
  }
}
```

## Run and connect to Vue
```js
import {connectWithDuck} from 'vue-saga-duck';
import Root from './Page';
import Duck from './PageDuck';

export default connectWithDuck(Root, Duck);
```
Page.vue
```js
<template>
    <div>
      {{ store.foo }}
      <button @click="btn">点我</button>
      <button @click="btn1">点我</button>
    </div>
  </template>
<script>

export default {
    props: ['dispatch', 'duck', 'store'],
    mounted() {
      console.log(this.store);
    },
    methods: {
        btn() {
        },
        btn1() {
          console.log(this.store)
        }
    }
}
</script>
```
PageDuck
```js
import { DuckMap } from 'vue-saga-duck';

export default class Ducks extends DuckMap {
    get quickTypes() {
        const TYPES = {
            SET_PARAMS: 1,
            SET_RELOAD: 2,
            SET_VAL: 3
        }
        return {
            ...super.quickTypes,
            ...TYPES
        }
    }
    get rawTypes() {
        return {
            ...super.rawTypes,
            AGE: 0
        }
    }
    get reducers() {
        const { types } = this;
        return {
            ...super.reducers,
            foo(state = 1, actions) {
                switch(actions.type) {
                    case types.SET_VAL:
                    
                        console.log(actions.payload)
                        return actions.payload;
                        break;
                    default:
                        return state;
                }
            }
        }
    }
    get quickDucks() {
        return {
            ...super.quickDucks,
            // route: Ducksss
        }
    }
    get creators() {
        const { types } = this;
        return {
            ...super.creators,
            reload(payload) {
                return {type: types.SET_RELOAD, payload}
            },
            val(payload) {
                return {type: types.SET_VAL, payload}
            }
        }
    }
    *saga() {
        yield* super.saga();
        const { types } = this;
    }
}


```