import {Duck} from 'vue-saga-duck';
import { takeEvery, call, put, select, delay } from "redux-saga/effects";

export default class extends Duck {
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
  get creators(){
    const { types } = this
    return {
      ...super.creators,
      add(num){
        return {
          type: types.INCREMENT_ASYNC,
          payload: num
        }
      }
    }
  }
  get rawSelectors() {
      return {
        ...super.rawSelectors,
        count: (state) => state.count
      }
  }
  *saga() {
    yield* super.saga();
    const { types, selector } = this;
    yield takeEvery(types.INCREMENT_ASYNC, function*(action) {
      yield delay(3000);
      const { count } = selector(yield select());
      yield put({type: types.INCREMENT, payload: action.payload});
    });
  }
}