(function (factory) {
  if(typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory;
  }
  else if(typeof define === 'function' && define.amd) {
    define([], factory);
  }
  else if(typeof exports === 'object') {
    exports["SVGWritable"] = factory;
  }
  else {
    window['SVGWritable'] = factory;
  }
}((function SVGWritableFactory(TextView, __DoublyLinkedMapFactory) {
    'use strict'

    function SVGWritable($el) {
      this.$svg = $el;
      this.$textWriter = null;
      this.store = __DoublyLinkedMapFactory.create();

      this.init();

      this.returnObject = this.createReturnObject();
      return this.returnObject;
    }

    (function SVGWritablePrototype() {

      this.init = function() {
        this.$svg.classList.add('svg-writable-container');
        this.$textWriter = this.createTextwriter();
      }

      this.toWriter = function($el, name, value) {
        if ($el == null) {
          console.error(`not exists element.`);
          return;
        }
        if (!this.$svg.contains($el)) {
          console.error(`not found element in svg container.`);
          return;
        }
        if (name == null) {
          console.error(`name attribute is required.`);
          return;
        }
        this.store.put(name, new TextView(this.$textWriter, $el, name, value));

        return this.returnObject;
      }

      this.createTextwriter = function() {
        const textarea = document.createElement('textarea');
        textarea.style.position = 'absolute';
        textarea.style.top = '-5px';
        textarea.style.left = '-5px';
        textarea.style.width = 0;
        textarea.style.height = 0;
        textarea.style.opacity = 0;

        this.$svg.insertAdjacentElement('beforebegin', textarea);

        return textarea;
      }

      this.destroy = function() {
        this.store.destroy();
        this.store = null;
        this.$textWriter.remove();
        this.$textWriter = null;
        this.$svg = null;
        this.returnObject = null;
      }

      this.createReturnObject = function() {
        return {
          writable: this.toWriter.bind(this),
          destroy: this.destroy.bind(this),
        };
      }

    }).call(SVGWritable.prototype);

    return {
        svg(selector) {
          const $svg = document.querySelector(selector);
          if ($svg == null) {
            console.error(`not found svg container '${selector}'`);
          }
          return new SVGWritable($svg);
        }
    };
}(


  (function TextViewFactory() {
    'use strict'

    function TextView($textWriter, $el, name, value) {
      this.$textWriter = $textWriter;
      this.$target = $el;
      this.name = name;
      this.value = value;
      this.$group = null;
      this.view = {
        $wrap: null,
        $el: null,
      };

      this.init();

      return this.createReturnObject();
    }

    (function TextViewPrototype() {

      this.getName = function() {
        return this.name;
      }

      this.getValue = function() {
        return this.value;
      }

      this.init = function() {
        this.$group = this.wrapToGroup();
        this.view = this.addTextView();
      }

      this.wrapToGroup = function() {
        const $el = this.$target;
        const $parent = $el.parentElement;
        if ($parent.tagName === 'g') {
          return $parent;
        }
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        $el.parentElement.insertBefore(g, $el);
        g.appendChild($el);
        return g;
      }

      this.addTextView = function() {
        const { x, y, width, height } = this.$target.getBoundingClientRect();

        const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        fo.setAttribute('x', x);
        fo.setAttribute('y', y);
        fo.setAttribute('width', width);
        fo.setAttribute('height', height);

        const viewWrap = document.createElement('div');
        viewWrap.style.width = `${width}px`;
        viewWrap.style.height = `${height}px`;
        viewWrap.style.display = 'flex';
        viewWrap.style.justifyContent = 'center';
        viewWrap.style.alignItems = 'center';

        const view = document.createElement('pre');
        view.style.width = 'auto';
        view.style.height = 'auto';
        view.style.margin = 0;
        view.classList.add('text-view');
        view.innerText = this.value;

        this.bindTypingEventListener(viewWrap, view);

        viewWrap.appendChild(view);
        fo.appendChild(viewWrap);
        this.$group.insertAdjacentElement('beforeend', fo);

        return {
          $wrap: fo,
          $el: viewWrap,
        };
      }

      this.bindTypingEventListener = function($viewWrap, $view) {
        const writeTextEventListener = e => {
          $view.innerText = this.value = e.target.value;
        };
        const writeFinishEventListener = () => {
          $view.classList.remove('typing');
          this.$textWriter.value = '';
          this.$textWriter.removeEventListener('input', writeTextEventListener);
          this.$textWriter.removeEventListener('blur', writeFinishEventListener);
        }

        $viewWrap.addEventListener('dblclick', (e) => {
          $view.classList.add('typing');
          this.$textWriter.focus();
          this.$textWriter.addEventListener('input', writeTextEventListener);
          this.$textWriter.addEventListener('blur', writeFinishEventListener);
          this.$textWriter.value = this.value = $view.innerText;
        });
      }

      this.destroy = function() {
        this.view.$el.remove();
        this.view.$wrap.remove();
        this.view = null;
        this.$group.remove();
        this.$group = null;
        this.$textWriter = null;
        this.$target = null;
        this.name = null;
        this.value = null;
      }

      this.createReturnObject = function() {
        return {
          destroy: this.destroy.bind(this),
          name: this.getName.bind(this),
          value: this.getValue.bind(this),
        };
      }

    }).call(TextView.prototype);

    return TextView;
  }()),

  
  (function DoublyLinkedMapFactory() {
    'use strict'


    function DoublyLinkedMap() {
      this.head = null;
      this.tail = null;
      this.map = Object.create(null);
      this.length = 0;

      return this.createReturnObject();
    }


    (function DoublyLinkedMapPrototype() {
      this.put = function (k, v) {
        const node = {
          key: k,
          value: v,
          prev: this.tail,
          next: null,
        };

        this.map[k] = node;

        if (this.length === 0) {
          this.head = node;
        }

        if (this.tail) {
          this.tail.next = node;
        }

        this.tail = node;
        this.length += 1;
      }

      this.remove = function (k) {
        const node = this.getNode(k);

        if (!node) {
          return;
        }

        if (this.isHead(node.key)) {
          if (node.next) {
            node.next.prev = null;
          }
          this.head = node.next;
        }

        if (this.isTail(node.key)) {
          if (node.prev) {
            node.prev.next = null;
          }
          this.tail = node.prev;
        }

        if (node.next) {
          node.next.prev = node.prev;
        }

        if (node.prev) {
          node.prev.next = node.next;
        }

        delete this.map[k];
        this.length -= 1;
      }

      this.clear = function () {
        this.head = null;
        this.tail = null;
        this.map = Object.create(null);
        this.length = 0;
      }
      
      this.destroy = function() {
        this.head = null;
        this.tail = null;
        this.map = null;
        this.length = null;
      }

      this.size = function () {
        return this.length;
      }

      this.get = function (k) {
        return this.getNode(k)?.value;
      }

      this.getNode = function (k) {
        return Object.prototype.hasOwnProperty.call(this.map, k) ? this.map[k] : null;
      }

      this.hasNext = function (k) {
        return this.getNode(k).next != null;
      }

      this.isHead = function (k) {
        return this.head === this.getNode(k);
      }

      this.isTail = function (k) {
        return this.tail === this.getNode(k);
      }

      this.getNextKey = function (k) {
        return this.hasNext(k) ? this.getNode(k).next.key : null;
      }

      this.contains = function (k) {
        return Object.prototype.hasOwnProperty.call(this.map, k);
      }

      this.each = function (callBack = () => false) {
        const
          len = this.length;

        let
          i = 0,
          param = null,
          node = this.head;

        while (i < len) {
          param = {
            key: node.key,
            value: node.value,
          };

          if (callBack(param, i) === false) {
            break;
          }

          node = node.next;
          i++;
        }
      }

      this.toArray = function () {
        const array = [];
        this.each(({ value }) => array.push(value));
        return array;
      }

      this.filter = function (callBack = () => false) {
        const array = [];
        this.each((param, i) => {
          if (callBack(param, i) === true) {
            array.push(param);
          }
        });
        return array;
      }

      this.createReturnObject = function() {
        return {
          get: this.get.bind(this),
          put: this.put.bind(this),
          remove: this.remove.bind(this),
          clear: this.clear.bind(this),
          destroy: this.destroy.bind(this),
          each: this.each.bind(this),
          toArray: this.toArray.bind(this),
          filter: this.filter.bind(this),
          size: this.size.bind(this),
          contains: this.contains.bind(this),
        };
      }

    }).call(DoublyLinkedMap.prototype);

    return {
      create() {
        return new DoublyLinkedMap();
      },
    };
  }()),

))));