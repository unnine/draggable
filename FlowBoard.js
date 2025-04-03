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
        this.$self = $el;
        this.drag = {
          el: null,
          items: [],
          active: false,
          activeItem: null,
          eventListeners: null,
        };
        this.hooks = {
          [this.EVENT.DRAG_START]: null,
          [this.EVENT.DRAGGING]: null,
          [this.EVENT.DRAG_END]: null,
        };
        this.init();
        return this.returnObject();
      }

      (function DragBoardPrototype() {

        this.EVENT = {
          DRAG_START: 'dragStart',
          DRAG_END: 'dragEnd',
          DRAGGING: 'dragging',
        };

        this.init = function() {
          this.bindEventListeners();
        }

        this.destroy = function() {
          this.releaseEventListeners();
          this.removeElements();
          
          this.store = null;
          this.$self = null;
          this.drag = null;
          this.hooks = null;
        }

        this.bindEventListeners = function() {
          this.drag.eventListeners = {
            dragStart: this.dragStart.bind(this),
            dragging: this.dragging.bind(this),
            dragEnd: this.dragEnd.bind(this),
          };

          this.$self.addEventListener("touchstart", this.drag.eventListeners.dragStart);
          this.$self.addEventListener("touchmove", this.drag.eventListeners.dragging);
          this.$self.addEventListener("touchend", this.drag.eventListeners.dragEnd);
          this.$self.addEventListener('mousedown', this.drag.eventListeners.dragStart);
          this.$self.addEventListener('mousemove', this.drag.eventListeners.dragging);
          this.$self.addEventListener('mouseup', this.drag.eventListeners.dragEnd);
        }
        
        this.releaseEventListeners = function() {
          this.$self.removeEventListener("touchstart", this.drag.eventListeners.dragStart);
          this.$self.removeEventListener("touchmove", this.drag.eventListeners.dragging);
          this.$self.removeEventListener("touchend", this.drag.eventListeners.dragEnd);
          this.$self.removeEventListener('mousedown', this.drag.eventListeners.dragStart);
          this.$self.removeEventListener('mousemove', this.drag.eventListeners.dragging);
          this.$self.removeEventListener('mouseup', this.drag.eventListeners.dragEnd);

          this.drag.eventListeners = null;
        }

        this.dragStart = function(e) {
          const dragItem = this.getSelectedDragItem(e.target);
  
          if (dragItem != null) {
            this.drag.active = true;
            this.drag.activeItem = dragItem;
            this.drag.activeItem.moveStart(this.clientX(e), this.clientY(e));
          }
          this.publishHook(this.EVENT.DRAG_START, e);
        }

        this.dragging = function(e) {
          if (!this.active) {
            return;
          }
          if (this.activeItem == null) {
            return;
          }
          e.preventDefault();
          this.activeItem.move(this.clientX(e), this.clientY(e));
          this.publishHook(this.EVENT.DRAGGING, e);
        }
  
        this.dragEnd = function(e) {
          this.active = false;
  
          if (this.activeItem != null) {
            this.activeItem.moveEnd();
            this.activeItem = null;
          }
          this.publishHook(this.EVENT.DRAG_END, e);
        }

        this.publishHook = function(eventType, originalEvent) {
          originalEvent.preventDefault();
          if (this.hooks[eventType] == null) {
            return;
          }
          this.hooks[eventType]({ eventType, originalEvent });
        }

        this.registerHook = function (eventType, listener) {
          this.hooks[eventType] = listener;
        }

        this.getSelectedDragItem = function($selectedItem) {
          for (let item of this.drag.items) {
            if (item.equals($selectedItem)) {
              return item;
            }
          }
          return null;
        }

        this.isTouched = function(e) {
          return e.type.startsWith('touch');
        }

        this.clientX = function(e) {
          if (this.isTouched(e)) {
            return e.touches[0].clientX;
          }
          return e.clientX;
        }.bind(this);
  
        this.clientY = function(e) {
          if (this.isTouched(e)) {
            return e.touches[0].clientY;
          }
          return e.clientY;
        }.bind(this);
  
        this.draggable = function(selector) {
          const $els = this.$self.querySelectorAll(selector);
          if ($els.length <= 0) {
            return;
          }
          for (let $el of $els) {
            this.drag.items.push(new Drag($el));
          }
        }

        this.returnObject = function() {
          return {
            draggable: this.draggable.bind(this),
            destroy: this.destroy.bind(this),
            onDragStart: this.registerHook.bind(this, this.EVENT.DRAG_START),
            onDragging: this.registerHook.bind(this, this.EVENT.DRAGGING),
            onDragEnd: this.registerHook.bind(this, this.EVENT.DRAG_END),
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

        const defaultOption = {
          svg: true,
        };
  
        function Drag($el, customOption) {
          this.items = [ this.makeDragItem($el) ];
          this.option = {
            ...defaultOption,
            ...customOption,
          };
          this.coord = {
            initX: 0,
            initY: 0,
            startedX: 0,
            startedY: 0,
            currentX: 0,
            currentY: 0,
            offsetX: 0,
            offsetY: 0,
          };
          return this.returnObject();
        }

        (function DragPrototype() {

          this.destroy = function() {
            if (this.items.length > 0) {
              for (let item of this.items) {
                item.$el.remove();
              }
            }
            this.items = null;
            this.option = null;
            this.coord = null;
          }

          this.moveStart = function(clientX, clientY) {
            const { x, y } = this.getCoordinate(clientX, clientY);
            this.startedX = x - this.offsetX;
            this.startedY = y - this.offsetY;
          }.bind(this);
    
          this.move = function(clientX, clientY) {
            const { x, y } = this.getCoordinate(clientX, clientY);
            this.coord.currentX = x - this.coord.startedX;
            this.coord.currentY = y - this.coord.startedY;
    
            this.coord.offsetX = this.coord.currentX;
            this.coord.offsetY = this.coord.currentY;
    
            for (let item of this.items) {
              if (this.isSVG(item)) {
                this.coordinate(item);
                continue;
              }
              this.translate(item);
            }
          }.bind(this);
    
          this.moveEnd = function() {
            this.coord.startedX = this.coord.currentX;
            this.coord.startedY = this.coord.currentY;
          }.bind(this);

          this.isSVG = function(item) {
            return item.$el.tagName === 'svg';
          }

          this.getCoordinate = function(clientX, clientY) {
            if (this.option.svg) {
              const CTM = this.items[0].$el.getScreenCTM();
              return {
                x: clientX / CTM.a,
                y: clientY / CTM.d,
              };
            }
            return {
              x: clientX,
              y: clientY,
            };
          }

          this.coordinate = function(item) {
            item.$el.setAttribute('x', this.coord.currentX + item.x);
            item.$el.setAttribute('y', this.coord.currentY + item.y);
          }

          this.translate = function(item) {
            item.$el.style.transform = `translate3d(${this.coord.currentX}px, ${this.coord.currentY}px, 0)`;
          }

          this.equals = function($el) {
            return this.items[0].$el == $el;
          }

          this.makeDragItem = function($el) {
            const { x, y } = $el.getBoundingClientRect();
            return { $el, x, y };
          }

          this.returnObject = function() {
            const _this = this;

            return {
              moveStart(clientX, clientY) {
                _this.moveStart(clientX, clientY);
                return this;
              },
              move(clientX, clientY) {
                _this.move(clientX, clientY);
                return this;
              },
              moveEnd() {
                _this.moveEnd();
              },
              equals($el) {
                _this.equals($el);
                return this;
              },
            };
          }

        }).call(Drag.prototype);
        
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
