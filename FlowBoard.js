(function(factory) {
  'use strict'

  if(typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory;
  }
  else if(typeof define === 'function' && define.amd) {
    define([], factory);
  }
  else if(typeof exports === 'object') {
    exports["FlowBoard"] = factory;
  }
  else {
    window['FlowBoard'] = factory;
  }
}(

  (function FlowBoardFactory(__DragBoardFactory, __DoublyLinkedMapFactory) {
    'use strict'

    const dragBoards = __DoublyLinkedMapFactory.create();

    return {
      on(selector) {
        const $el = document.querySelector(selector);

        if (dragBoards.contains($el)) {
          throw new Error('already registered element.');
        }
        dragBoards.put($el, __DragBoardFactory.create($el, __DoublyLinkedMapFactory.create()));

        return {
          draggable: (selector) => this.draggable.call(this, $el, selector),
        };
      },

      draggable($el, selector) {
        const dragBoard = dragBoards.get($el);
        dragBoard.draggable(selector);
      },
    };
  }(

    (function DragBoardFactory(Drag) {
      'use strict'

      function DragBoard($el, doublyLinkedMap) {
        this.store = doublyLinkedMap;
        this.$board = $el;
        this.dragItems = [];
      }

      (function DragBoardPrototype() {

        this.draggable = function(selector) {
          const $els = this.$board.querySelectorAll(selector);
          if ($els.length <= 0) {
            return;
          }
          for (let $el of $els) {
            this.dragItems.push(new Drag($el));
          }
          console.log(this.dragItems);
          return this.returnObject;
        }

        this.returnObject = function() {
          return {
            draggable: this.draggable.bind(this),
          };
        }

      }).call(DragBoard.prototype);

      return {
        create($el, doublyLinkedMap) {
          return new DragBoard($el, doublyLinkedMap);
        },
      };
    }(

      (function DragFactory() {
        'use strict'
  
        function Drag($el) {
  
        }
        
        return Drag;
      }()),

    )),

    (function DoublyLinkedMapFactory() {
      'use strict'


      function DoublyLinkedMap() {
        this.head = null;
        this.tail = null;
        this.map = Object.create(null);
        this.length = 0;

        return this.returnObject();
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

        this.returnObject = function() {
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
    
  )),

));
