<template>
    <div>
        数字：{{ count }}
        <button @click="increment">三秒之后数字+10</button>
    </div>
</template>

<script>
import { defineComponent } from 'vue'
export default defineComponent({
    props: ['dispatch', 'duck', 'store'],
    setup(props) {
        const { duck, store, dispatch } = props;
        const { creators, selectors } = duck
        const count = selectors.count(store)
        const increment = () => {
            dispatch(creators.add(10))
        }
        return {
            count,
            increment
        }
    }
})
</script>