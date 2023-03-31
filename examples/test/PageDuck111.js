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
