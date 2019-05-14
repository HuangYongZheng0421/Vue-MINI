class Compiler {
  constructor (el, vm) {
    
    this.$el = document.querySelector (el);

    this.$vm = vm;

    if (this.$el) {

      // 转换el里面的内容为片段Fragment
      this.$fragment = this.node2Fragment (this.$el);

      // 编译
      this.compile (this.$fragment);

      // 将编译结果追加至$el
      this.$el.appendChild (this.$fragment);
    }
  }

  // 将宿主元素中代码片段拿出来遍历，这样做比较高效
  node2Fragment (el) {
    //创建代码片段.
    const frag = document.createDocumentFragment ();
    // 将el中所有子元素搬家至frag中
    let child;
    while ((child = el.firstChild)) {
      frag.appendChild (child);
    }
    return frag;
  }
  // 编译过程
  compile (el) {
    
    const childNodes = el.childNodes;
    Array.from (childNodes).forEach (node => {
      if (this.isElement (node)) {
        // 编译元素

        //得到元素里面的所有属性
        const nodeAttrs = node.attributes;
        // 遍历该元素 找到我们想要的.
        Array.from (nodeAttrs).forEach (attr => {
          //属性名称
          const attrName = attr.name;
          // 属性值
          const exp = attr.value;
          // 是否是 m- 开头
          if (this.isDirective (attrName)) {
            //拿出属性名称后面的内容  m-text  得到 text
            const dir = attrName.substring (2);
            // 执行指令
            this[dir] && this[dir] (node, this.$vm, exp);
          }
          // 是否是@click事件
          if (this.isEvent (attrName)) {
            const dir = attrName.substring (1);
            this.eventHandler (node, this.$vm, exp, dir);
          }
        });
      } else if (this.isInterpolation (node)) {
        // 编译插值文本.
        this.compileText (node);
      }

      // 递归子节点
      if (node.childNodes && node.childNodes.length > 0) {
        this.compile (node);
      }
    });
  }

  compileText (node) {
    this.update (node, this.$vm, RegExp.$1, 'text');
  }

  // 更新函数
  update (node, vm, exp, dir) {
    const updaterFn = this[dir + 'Update'];
    // 初始化
    updaterFn && updaterFn (node, vm[exp]);

    // 依赖收集
    new Watcher (vm, exp, function (value) {
      updaterFn && updaterFn (node, value);
    });
  }
  //解析编译 m-text
  text (node, vm, exp) {
    this.update (node, vm, exp, 'text');
  }

  textUpdate (node, value) {
    node.textContent = value;
  }
  // 解析编译 m-html
  html (node, vm, exp) {
    this.update (node, vm, exp, 'html');
  }

  htmlUpdate (node, value) {
    node.innerHTML = value;
  }

  // 解析编译 m-model
  model (node, vm, exp) {
    // 指定input的value属性
    this.update (node, vm, exp, 'model');

    // 视图对模型响应
    node.addEventListener ('input', e => {
      vm[exp] = e.target.value;
    });
  }

  modelUpdate (node, value) {
    node.value = value;
  }
  //   事件处理器
  eventHandler (node, vm, exp, dir) {
    let fn = vm.$options.methods && vm.$options.methods[exp];
    if (dir && fn) {
      node.addEventListener (dir, fn.bind (vm));
    }
  }

  //-------------------------------------------------------------------------------
  // 判断是否是指令 
  isDirective (attr) {
    return attr.indexOf ('m-') == 0;
  }
  // 判断是否是事件
  isEvent (attr) {
    return attr.indexOf ('@') == 0;
  }
  // 判断是否是元素
  isElement (node) {
    return node.nodeType === 1;
  }
  // 判断是否是插值文本
  isInterpolation (node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test (node.textContent);
  }
}
