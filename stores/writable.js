import _, { isEmpty } from "lodash";
import { writable, get } from "svelte/store";

class Writable {
  constructor(initialState, options = {}) {
    this._persistentMode = options.key ? true : false;

    this.initialState =
      this._persistentMode && !options.overwrite
        ? this.getDataFromStorage(options.key, initialState)
        : initialState;

    console.log(this.initialState);
    this.options = {
      defineGettersAndSetters: true,
      key: null,
      ...options
    };

    const store = writable(_.cloneDeep(this.initialState));

    this.writable = writable;
    this.subscribe = store.subscribe;

    this._update = store.update;
    this._set = store.set;

    if (this.options.defineGettersAndSetters && _.isObject(initialState)) {
      this.defineGettersAndSetters(this.initialState);
    }

    this.storeData(this.json);
  }

  update(...args) {
    const temp = this._update(...args);

    if (this._persistentMode) {
      this.storeData(this.json);
    }

    return temp;
  }
  set(...args) {
    const temp = this._set(...args);

    if (this._persistentMode) {
      this.storeData(this.json);
    }
    return temp;
  }

  storeData(data) {
    if (isEmpty(data)) return;
    let string = JSON.stringify(data);
    localStorage.setItem(this.options.key, string);
  }

  getDataFromStorage(key, initialState) {
    try {
      let data = localStorage.getItem(key);
      if (data) {
        const parsedData = JSON.parse(data);

        if (isEmpty(parsedData)) {
          return initialState;
        }
        return parsedData;
      } else {
        return initialState;
      }
    } catch (err) {
      console.error(err);
    }
    return initialState;
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