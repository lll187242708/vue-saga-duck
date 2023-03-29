import Vue from 'vue'
import { createStore as createReduxStore, applyMiddleware, compose } from "redux";
import connect from './connect';
import createSagaMiddleware from 'redux-saga'
import { parallel } from "redux-saga-catch";
import logger from 'redux-logger'

export const INIT = "@@duck-runtime-init";
export const END = "@@duck-runtime-end";

export default class DuckRuntime {
    constructor(duck, ...middlewares){
        this.duck = duck;
        this._tasks = [];
        let options;
        if(middlewares.length === 1 && typeof middlewares[0] === 'object'){
            options = middlewares[0]
        } else {
            options = {
                middlewares
            }
        }
        this.middlewares = options.middlewares || [];
        this.enhancers = options.enhancers || [];
        this._initStore();
    }
    _initStore() {
        const duck = this.duck;
        const sagaMiddleware = (this.sagaMiddleware = createSagaMiddleware());
        const enhancer = compose(
            applyMiddleware(sagaMiddleware, ...this.middlewares, logger),
            ...this.enhancers,
        );

        this.store = createReduxStore(duck.reducer, enhancer);

        this.addSaga(duck.sagas);
    }
    addSaga(sagas) {
        const task = this.sagaMiddleware.run(function*() {
          yield parallel(sagas);
        });
        this._tasks.push(task);
        return task;
    }
    destroy(){
        const tasks = this._tasks;
        this._tasks = [];
        tasks.forEach(task=>{
          task.cancel();
        });
    }
    connect() {
        const duck = this.duck;
        return function decorate(Container) {
            return connect(
                state => ({ store: state }),
                dispatch => ({
                    duck,
                    dispatch
                })
            )(Container);
        }
    }
    destroy(){
        const tasks = this._tasks;
        this._tasks = [];
        tasks.forEach(task=>{
            task.cancel();
        });
    }
    root(autoDestroy = true) {
        const duckRuntime = this
        const store = this.store;
        return function decorate(Container) {
            return Vue.component('AttachedContainer', 
                {
                    props: ['store', 'dispatch', 'duck'],
                    mounted() {
                        store.dispatch({ type: INIT });
                        if (super.mounted) {
                            return super.mounted();
                        }
                    },
                    beforeDestroy() {
                        store.dispatch({ type: END });
                        if(autoDestroy){
                            duckRuntime.destroy();
                        }
                        if (super.beforeDestroy) {
                            return super.beforeDestroy();
                        }
                    },
                    render(createElement) {
                        return  createElement(Container, {props: this.$props})
                    }
                }
            )
        }
    }
    connectRoot() {
        const decorateRoot = this.root();
        const decorateConnect = this.connect();
        return function decorate(Container) {
            return decorateConnect(decorateRoot(Container));
        };
    }
}