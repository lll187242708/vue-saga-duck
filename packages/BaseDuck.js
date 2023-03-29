export function getDefaultDuckOptions() {
    return {
        namespace: Math.random().toString(36).slice(2, 10),
        selector(a) {
            return a;
        },
        route: ''
    }
}

export default class BaseDuck {
    constructor(options =  getDefaultDuckOptions()) {
        this.options = options;
        this._checkDisallowInheritGetters();
        this._makeCacheGetters();
    }

    get _disallowInheritGetters() {
        return ["types", "selectors", "selector"];
    }

    _checkDisallowInheritGetters() {
        for (const property of this._disallowInheritGetters) {
            let target = this;
            let count = 0;
            while (target) {
                target = Object.getPrototypeOf(target);
                if (!target) {
                  break;
                }
                const descriptor = Object.getOwnPropertyDescriptor(target, property);
                if(descriptor) {
                  count ++;
                }
                if(count > 1) {
                  throw new Error(`Getter ${property}() disallow inherit`);
                }
            }
        }
    }

    get actionTypePrefix() {
        const { namespace, route } = this.options;
        return route ? `${namespace}/${route}/` : `${namespace}/`;
    }

    get _cacheGetters() {
        return ["types", "rawSelectors", "selectors"];
    }

    _makeCacheGetters() {
        const me = this;
        for (const property of this._cacheGetters) {
            let descriptor = null;
            let target = this;

            while (!descriptor) {
                target = Object.getPrototypeOf(target);
                if (!target) {
                break;
                }
                descriptor = Object.getOwnPropertyDescriptor(target, property);
            }
            if (!descriptor) {
                continue;
            }
            let cache;
            Object.defineProperty(this, property, {
                get() {
                if (!cache) {
                    cache = descriptor.get.call(me);
                }
                return cache;
                }
            });
        }
    }

    get types() {
        return Object.assign(
          {},
          this.makeTypes(this.quickTypes),
          this.rawTypes
        );
    }

    get quickTypes() {
        return {};
    }

    get rawTypes() {
        return {};
    }
    
    makeTypes(typeEnum) {
        const prefix = this.actionTypePrefix;
        let typeList = [];
        const types = {};
        if (typeEnum) {
            typeList = typeList.concat(Object.keys(typeEnum));
        }
        typeList.forEach((type) => {
            types[type] = prefix + type;
        });
        return types;
    }

    get State() {
        throw new Error(
          "State() Only use for get state type in Typescript, should not be invoke"
        );
    }
    
    get reducer() {};

    get creators() {
        return {};
    }

    get selector() {
        return this.options.selector;
    }

    get selectors() {
        const { selector, rawSelectors } = this;
        const selectors = {};
        for (const key of Object.keys(rawSelectors)) {
            selectors[key] = (globalState, ...rest) =>
              rawSelectors[key](selector(globalState), ...rest);
        }
        return selectors;
    }

    get rawSelectors() {
        return {};
    }

    *saga() {}

    get sagas() {
        return [this.saga.bind(this)];
    }
}