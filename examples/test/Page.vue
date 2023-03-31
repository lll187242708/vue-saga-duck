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