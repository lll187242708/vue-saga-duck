import Vue from 'vue';

export default function connect(mapStateToProps, mapDispachToProp) {
  return function enhanceHOC(WrappedComponent) {
    return Vue.component('EnhanceComponent', {
        inject: ['store'],
        data() {
          return {
            storeState: mapStateToProps(this.store.getState())
          }
        },
        created() {
          this.unsubscribe = this.store.subscribe(() => {
            this.storeState = mapStateToProps(this.store.getState());
          })
        },
        beforeDestroy() {
          this.unsubscribe();
        },
        render(createElement) {
            return createElement(WrappedComponent, {
                props: {
                    ...this.props,  
                    ...mapStateToProps(this.storeState.store),
                    ...mapDispachToProp(this.store.dispatch)
                } 
            })
        }
    })
  }
}