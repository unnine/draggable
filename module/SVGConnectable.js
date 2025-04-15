(function (factory) {
    if(typeof exports === 'object' && typeof module === 'object') {
      module.exports = factory;
    }
    else if(typeof define === 'function' && define.amd) {
      define([], factory);
    }
    else if(typeof exports === 'object') {
      exports["SVGConnectable"] = factory;
    }
    else {
      window['SVGConnectable'] = factory;
    }
  }((function SVGConnectableFactory(TextView, __DoublyLinkedMapFactory) {
      'use strict'
  
      function SVGConnectable($el) {
        this.$board = $el;

        this.init();
      }
  
      (function SVGConnectablePrototype() {
        
        this.init = function() {
          this.bindEventListeners();
        }

        this.bindEventListeners = function() {
          this.eventListeners = {
            [this.EVENT.DRAG.START]: this.dragStartListener.bind(this),
            [this.EVENT.DRAG.ING]: this.draggingListener.bind(this),
            [this.EVENT.DRAG.END]: this.dragEndListener.bind(this),
          };
  
          this.$board.addEventListener("touchstart", this.eventListeners[this.EVENT.DRAG.START], { passive: true });
          this.$board.addEventListener("touchmove", this.eventListeners[this.EVENT.DRAG.ING], { passive: true });
          this.$board.addEventListener("touchend", this.eventListeners[this.EVENT.DRAG.END], { passive: true });
  
          this.$board.addEventListener('mousedown', this.eventListeners[this.EVENT.DRAG.START]);
          this.$board.addEventListener('mousemove', this.eventListeners[this.EVENT.DRAG.ING]);
          this.$board.addEventListener('mouseup', this.eventListeners[this.EVENT.DRAG.END]);
  
          return this.returnObject;
        }

      }).call(SVGConnectable.prototype);
  
      return {
        on(selector) {
            const $board = document.querySelector(selector);
            if ($board == null) {
                console.error(`not found connectable board container. '${selector}'`);
                return;
            }
            return new SVGConnectable($board);
        },
      };
  }(
  
  
    (function TextViewFactory() {
      'use strict'
  
      function TextView() {
      }
  
      (function TextViewPrototype() {
  
  
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