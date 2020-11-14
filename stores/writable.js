import _ from 'lodash'
import { writable, get } from 'svelte/store'

class WritableStore {
  constructor(initialState, definePropertiesAsGettersAndSetters = true) {
    this.initialState = {
      ..._.cloneDeep(initialState),
    }

    const store = writable(_.cloneDeep(initialState))

    this.update = store.update
    this.subscribe = store.subscribe
    this.set = store.set
    this.writable = writable

    if (definePropertiesAsGettersAndSetters && _.isObject(initialState)) {
      this.defineGettersAndSetters(initialState)
    }
  }

  reset() {
    this.set(this.initialState)
  }

  getData() {
    return get(this)
  }

  defineGettersAndSetters(options = {}) {
    for (let key in options) {
      if (key === 'current' || key === 'json') return
      Object.defineProperty(this, key, {
        get: function() {
          return this.current[key]
        },
        set: function(value) {
          this.update(state => ({ ...state, [key]: value }))
        },
      })
    }
  }

  get current() {
    return this.getData()
  }

  set current(value) {
    this.set(value)
  }

  get json() {
    const current = this.current
    if (_.isObject(current)) {
      for (let key in current) {
        const item = current[key]

        if (_.isArray(item)) {
          current[key] = item.map(e => {
            if (_.isObject(e) && e instanceof WritableStore) {
              return e.json
            }
            return e
          })
        } else if (_.isObject(item) && item instanceof WritableStore) {
          current[key] = item.json
        }
      }
    }
    return current
  }
}

export default WritableStore
