import _ from "lodash";
import { writable, get } from "svelte/store";

class Writable {
  constructor(initialState, options) {
    this.initialState = {
      ..._.cloneDeep(initialState)
    };

    this._persistentMode = true && options.key;

    let storedData = this._persistentMode
      ? this.getDataFromStorage(options.key) || {}
      : {};

    this.options = {
      defineGettersAndSetters: true,
      key: null,
      ...options,
      ...storedData
    };

    const store = writable(_.cloneDeep(initialState));

    this.update = store.update;
    this.subscribe = store.subscribe;
    this.writable = writable;

    this._set = store.set;
    this.storeData();

    if (this.options.defineGettersAndSetters && _.isObject(initialState)) {
      this.defineGettersAndSetters(initialState);
    }
  }

  set(...args) {
    if (this._persistentMode) {
      this.storeData(args[0]);
    }
    return this._set(...args);
  }

  storeData(data) {
    if (!data) return;
    let string = JSON.stringify(data);
    localStorage.setItem(this.key, string);
  }

  getDataFromStorage(key) {
    try {
      let data = localStorage.getItem(key);
      if (data) {
        const parsedData = JSON.parse(data);
        return parsedData;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  }

  reset() {
    this.set(this.initialState);
  }

  getData() {
    return get(this);
  }

  defineGettersAndSetters(options = {}) {
    for (let key in options) {
      if (key === "current" || key === "json") return;
      Object.defineProperty(this, key, {
        get: function () {
          return this.current[key];
        },
        set: function (value) {
          this.update((state) => ({ ...state, [key]: value }));
        }
      });
    }
  }

  get current() {
    return this.getData();
  }

  set current(value) {
    this.set(value);
  }

  get json() {
    const current = this.current;
    if (_.isObject(current)) {
      for (let key in current) {
        const item = current[key];

        if (_.isArray(item)) {
          current[key] = item.map((e) => {
            if (_.isObject(e) && e instanceof Writable) {
              return e.json;
            }
            return e;
          });
        } else if (_.isObject(item) && item instanceof Writable) {
          current[key] = item.json;
        }
      }
    }
    return current;
  }
}

export default Writable;
