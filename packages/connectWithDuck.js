import Vue from 'vue'
import DuckRuntime from "./DuckRuntime"

export default function connectWithDuck(Component, Duck, extraMiddlewares = []) {
    const { duckRuntime, ConnectedComponent, props } = (function ConnectedWithDuck(props) {
        const duckRuntime = new DuckRuntime(
            new Duck(),
            ...extraMiddlewares
        )

        const ConnectedComponent = duckRuntime.connectRoot()(Component)

        return {
            duckRuntime,
            ConnectedComponent,
            props
        }
    })()
    return (
        Vue.component('ConnectedComponent', {
            provide: {
                store: duckRuntime.store
            },
            render(createElement) {
                return createElement(ConnectedComponent, {props})
            }
        })
    )
}
