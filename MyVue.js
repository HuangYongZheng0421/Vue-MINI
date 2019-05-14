class MyVue {
  constructor (options) {
    this.$options = options;

    //数据响应化.
    this.$data = options.data;
    this.observe (this.$data);

    new Compiler (options.el, this);

    //执行Created生命周期
    if (options.created) {
      options.created.call (this);
    }
  }

  observe (value) {
    // 传进来的必须是object类型
    if (!value || typeof value !== 'object') {
      return;
    }

    // 遍历该对象
    Object.keys (value).forEach (key => {
      this.defineReactive (value, key, value[key]);

      //代理data中的属性到vue实例上
      this.proxyData (key);
    });
  }

  defineReactive (obj, key, val) {
    // 递归解决嵌套问题.
    this.observe (val);

    const dep = new Dep ();

    Object.defineProperty (obj, key, {
      get () {
        Dep.target && dep.addDep (Dep.target);
        return val;
      },
      set (newVal) {
        if (val === newVal) {
          return;
        }
        val = newVal;

        dep.notify ();
      },
    });
  }
  //代理data中的属性到vue实例上
  proxyData (key) {
    Object.defineProperty (this, key, {
      get () {
        return this.$data[key];
      },
      set (newVal) {
        this.$data[key] = newVal;
      },
    });
  }
}

class Dep {
  constructor () {
    // 存放若干依赖.
    this.deps = [];
  }

  // 添加依赖.
  addDep (dep) {
    this.deps.push (dep);
  }

  //通知更新

  notify () {
    this.deps.forEach (dep => dep.update ());
  }
}

class Watcher {
  constructor (vm, key, cb) {
    this.vm = vm;
    this.key = key;
    this.cb = cb;

    // 将当前的实例指定到Dep静态属性target中.

    Dep.target = this;
    //触发getter添加依赖.
    this.vm[this.key];
    Dep.target = null;
  }

  update () {
    this.cb.call (this.vm, this.vm[this.key]);
  }
}
