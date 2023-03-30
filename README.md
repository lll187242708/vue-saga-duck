# vue-saga-duck

### 解决问题
Vue 的模版化配置，使得 Vue 更加简单，但是随之而来的就是死板，不够灵活。想要复用一些逻辑，可以通过混入（mixin）来分发组件中可复用的功能.

混入 (mixin) 的缺点：
- 如果是页面级别的逻辑，在 Vue 中不好抽离出来，抽离出来也需要靠 mixin 混入，逻辑来源不明确。
- 如果是组件中相同逻辑的复用，需要抽离成单组件，或者使用 mixin 混入，比较混乱。
- mixin 本身的特点，混入越多逻辑，越乱，并且容易相互覆盖影响。

### duck带来什么好处
- 类的使用给 Vue 带来了“可拓展”的特性。
- DuckMap 为 duck 带来了“可组合”特性。
- 最终将极大的提高代码的复用性。

### 为什么没有使用 vuex，而使用 redux
- Vuex 是通过 actions 来派发异步行为，可控性低。
- Vue 生态圈没有提供像 redux-saga 一样的 vue-saga，所以先用 redux-saga（到时候搞一个 vue-saga，与 vuex 组合，可以换掉 redux, 毕竟融合度上来说还是 vuex 更贴切 vue）
vuex 特性。 vue + react-saga

# Getting started

## 安装
```sh
npm install vue-saga-duck -S
```
or
```sh
yarn add vue-saga-duck -S
```

# 项目启动
Run command:
```sh
npm npm serve
```

# 使用案例
## saga 与 vue 融合
```js
// index.js
import {connectWithDuck} from 'vue-saga-duck';
import Root from './Page';
import Duck from './PageDuck';

export default connectWithDuck(Root, Duck);
```

```js
// Page.vue
<template>
    <div>
      数字：{{ store.count }}
      <button @click="increment">三秒之后数字+10</button>
    </div>
  </template>
<script>

export default {
    props: ['dispatch', 'duck', 'store'],
    methods: {
        increment() {
          const { creators } = this.duck;
          this.dispatch(creators.add(10))
        }
    }
}
</script>
```

```js
// PageDuck.js
import { Duck } from "vue-saga-duck";
import { takeEvery, call, put, select } from "redux-saga/effects";

class Home extends Duck {
  get quickTypes() {
    return {
      ...super.quickTypes,
      INCREMENT: 1,
      INCREMENT_ASYNC: 1,
    };
  }
  get reducers() {
    const { types } = this;
    return {
      ...super.reducers,
      count: (state = 0, action) => {
        switch (action.type) {
          case types.INCREMENT:
            return state + action.payload;
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
      yield call(delay, 3000);
      const { count } = selector(yield select());
      yield put({type: types.INCREMENT});
    });
  }
}
```


## 继承 Duck 逻辑
```js
import Home from './home/PageDuck'
class ExtendedDuck extends Home {
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

## 组合Duck
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
