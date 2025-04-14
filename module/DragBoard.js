(function (factory) {
  if(typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory;
  }
  else if(typeof define === 'function' && define.amd) {
    define([], factory);
  }
  else if(typeof exports === 'object') {
    exports["DragBoard"] = factory;
  }
  else {
    window['DragBoard'] = factory;
  }
}((function DragBoardFactory(Drag, __DoublyLinkedMapFactory) {
    'use strict'

    function DragBoard($el, option = {}) {     
      this.initialized = false;
      this.option = option;
      this.store = __DoublyLinkedMapFactory.create();
      this.$board = $el;
      this.eventListeners = {};
      this.hooks = {};
      this.draggable = {
        $elements: [],
        items: [],
      };
      this.state = {
        drag: {
          active: false,
          el: null,
        },
      };
      this.returnObject = this.returnObject();
      return this.returnObject;
    }

    (function DragBoardPrototype() {

      this.EVENT = {
        LIFE_CYCLE: {
          READY: 'life_cycle_ready',
          DESTROY: 'life_cycle_destroy',
        },
        DRAG: {
          START: 'dragStart',
          END: 'dragEnd',
          ING: 'dragging',
        },
      };

      this.init = function() {
        this.bindEventListeners();
        this.callHook(this.EVENT.LIFE_CYCLE.READY, {
          container: this.$board,
          draggable: this.draggable.$elements,
        });
        this.initialized = true;
      };

      this.registerHook = function(eventType, hook) {
        this.hooks[eventType] = hook;
        return this.returnObject;
      }

      this.callHook = function(eventType, event = {}) {
        if (this.hooks[eventType]) {
          this.hooks[eventType]({ type: eventType, ...event });
        }
      }

      this.bindEventListeners = function() {
        this.eventListeners = {
          [this.EVENT.DRAG.START]: this.dragStartListener.bind(this),
          [this.EVENT.DRAG.ING]: this.draggingListener.bind(this),
          [this.EVENT.DRAG.END]: this.dragEndListener.bind(this),
        };

        this.$board.addEventListener("touchstart", this.eventListeners.dragStart, { passive: true });
        this.$board.addEventListener("touchmove", this.eventListeners.dragging, { passive: true });
        this.$board.addEventListener("touchend", this.eventListeners.dragEnd, { passive: true });

        this.$board.addEventListener('mousedown', this.eventListeners.dragStart);
        this.$board.addEventListener('mousemove', this.eventListeners.dragging);
        this.$board.addEventListener('mouseup', this.eventListeners.dragEnd);

        return this.returnObject;
      }

      this.releaseEventListeners = function() {
        this.$board.removeEventListener("touchstart", this.eventListeners[this.EVENT.DRAG.START]);
        this.$board.removeEventListener("touchmove", this.eventListeners[this.EVENT.DRAG.ING]);
        this.$board.removeEventListener("touchend", this.eventListeners[this.EVENT.DRAG.END]);

        this.$board.removeEventListener("mousedown", this.eventListeners[this.EVENT.DRAG.START]);
        this.$board.removeEventListener("mousemove", this.eventListeners[this.EVENT.DRAG.ING]);
        this.$board.removeEventListener("mouseup", this.eventListeners[this.EVENT.DRAG.END]);
      }

      this.getSelectedItem = function($selectedElement) {
        for (let item of this.draggable.items) {
          if (item.equals($selectedElement)) {
            return item;
          }
        }
        return null;
      }

      this.dragStartListener = function(e) {
        const dragItem = this.getSelectedItem(e.target);
        this.startDrag(dragItem, this.getClientCoord(e));
        this.callHook(this.EVENT.DRAG.START, {
          originEvent: e,
          target: dragItem,
        });
      }

      this.draggingListener = function(e) {
        if (!this.isDragging()) {
          return;
        }
        this.moveDrag(this.getClientCoord(e));
        this.callHook(this.EVENT.DRAG.ING, {
          originEvent: e,
          target: this.currentDraggingElement(),
        });
      }

      this.dragEndListener = function(e) {
        this.callHook(this.EVENT.DRAG.END, {
          originEvent: e,
          target: this.currentDraggingElement(),
        });
        this.endDrag();
      }

      this.startDrag = function(dragItem, clientCoord) {
        if (dragItem == null) {
          return;
        }
        this.state.drag.active = true;
        this.state.drag.el = dragItem;
        this.state.drag.el.start(clientCoord); 
      }

      this.moveDrag = function(clientCoord) {
        this.state.drag.el.move(clientCoord);
      }

      this.endDrag = function() {
        if (!this.isDragging()) {
          return;
        }
        this.state.drag.el.end();
        this.state.drag.active = false;
        this.state.drag.el = null;
      }

      this.isDragging = function() {
        return this.state.drag.active;
      }

      this.currentDraggingElement = function() {
        return this.state.drag.el;
      }

      this.getClientCoord = function(e) {
        let target = e;

        if (this.isTouched(e)) {
          target = e.touches[0];
        }
        return {
          clientX: target.clientX,
          clientY: target.clientY,
        };
      }.bind(this);

      this.isTouched = function(e) {
        return e.type.startsWith('touch');
      }

      this.getAndAddToDraggableItem = function(selector) {
        const $els = this.$board.querySelectorAll(selector);
        if ($els.length <= 0) {
          return;
        }
        for (let $el of $els) {
          this.draggable.items.push(new Drag($el, this.option));
          this.draggable.$elements.push($el);
        }
        return this.returnObject;
      }

      this.render = function() {
        if (!this.initialized) {
          this.init();
        }
        return this.returnObject;
      }

      this.destroy = function() {
        this.callHook(this.EVENT.LIFE_CYCLE.DESTROY, {
          container: this.$board,
          draggable: this.draggable.$elements,
        });
        this.removeElements();
        this.releaseEventListeners();
        this.eventListeners = null;
        this.$board = null;
        this.returnObject = null;
        this.store = null;
        this.draggable = null;
        this.state = null;
        this.option = null;
        this.hooks = null;
      }

      this.removeElements = function() {
        for (let item of this.draggable.items) {
          item.destroy();
        }
        this.$board.remove();
      }

      this.returnObject = function() {
        return {
          draggable: this.draggable.bind(this),
        };
      }

      this.returnObject = function() {
        return {
          draggable: this.getAndAddToDraggableItem.bind(this),
          destroy: this.destroy.bind(this),
          onReady: this.registerHook.bind(this, this.EVENT.LIFE_CYCLE.READY),
          onDestroy: this.registerHook.bind(this, this.EVENT.LIFE_CYCLE.DESTROY),
          onDragStart: this.registerHook.bind(this, this.EVENT.DRAG.START),
          onDragging: this.registerHook.bind(this, this.EVENT.DRAG.ING),
          onDragEnd: this.registerHook.bind(this, this.EVENT.DRAG.END),
          render: this.render.bind(this),
        };
      }
    }).call(DragBoard.prototype);

    return {
      on(selectorId, option) {
        const $board = document.querySelector(selectorId);
        return new DragBoard($board, option);
      },
    };
}(

  (function DragFactory() {
    'use strict'

    function Drag($el, option = {}) {
      this.self = null;
      this.siblingItems = [];
      
      this.option = option;

      this.initialX = 0;
      this.initialY = 0;

      this.startedX = 0;
      this.startedY = 0;

      this.currentX = 0;
      this.currentY = 0;

      this.offsetX = 0;
      this.offsetY = 0;

      this.init($el);
    }

    (function DragPrototype() {

      this.init = function($el) {
        this.self = this.toDragItem($el);

        const { x, y } = $el.getBoundingClientRect();
        this.initialX = x;
        this.initialY = y;
        this.startedX = x;
        this.startedY = y;
        this.currentX = x;
        this.currentY = y;

        this.setSiblingElements($el);
      }

      this.setSiblingElements = function($el) {
        if (!this.option.withSibling) {
          return;
        }
        const nextSiblings = this.getNextSiblingAll($el);
        const prevSiblings = this.getPrevSiblingAll($el);

        this.siblingItems.push(...prevSiblings);
        this.siblingItems.push(...nextSiblings);
      }

      this.getNextSiblingAll = function($el) {
        const nextSiblings = [];
        let $next = $el;
        
        while($next.nextElementSibling) {
          $next = $next.nextElementSibling;
          nextSiblings.push(this.toDragItem($next));
        }
        return nextSiblings;
      }

      this.getPrevSiblingAll = function($el) {
        const prevSiblings = [];
        let $prev = $el;
        
        while($prev.prevElementSibling) {
          $prev = $prev.prevElementSibling;
          prevSiblings.push(this.toDragItem($prev));
        }
        return prevSiblings;
      }

      this.toDragItem = function($el) {
        const { x, y } = $el.getBoundingClientRect();
        return { $target: $el, initialX: x, initialY: y };
      }

      this.start = function({ clientX, clientY }) {
        const { x, y } = this.getCoord(clientX, clientY);
        this.startedX = x - this.offsetX;
        this.startedY = y - this.offsetY;
      }

      this.move = function({ clientX, clientY }) {
        const { x, y } = this.getCoord(clientX, clientY);
        this.currentX = x - this.startedX;
        this.currentY = y - this.startedY;

        this.offsetX = this.currentX;
        this.offsetY = this.currentY;

        this.changeCoord(this.self);

        for (let siblingItem of this.siblingItems) {
          this.changeCoord(siblingItem);
        }
      }

      this.end = function() {
        this.startedX = this.currentX;
        this.startedY = this.currentY;
      }

      this.getCoord = function(clientX, clientY) {
        if (this.option.svg) {
          return this.getCoordSvg(clientX, clientY);
        }
        return {
          x: clientX,
          y: clientY,
        };
      }

      this.getCoordSvg = function(clientX, clientY) {
        const CTM = this.self.$target.getScreenCTM();
        return {
          x: clientX / CTM.a,
          y: clientY / CTM.d,
        };
      }

      this.changeCoord = function(dragItem) {
        if (this.isSvg(dragItem)) {
          this.changeCoordSvg(dragItem);
          return;
        }
        this.changeCoordStyle(dragItem);
      }

      this.isSvg = function(dragItem) {
        return dragItem.$target.tagName === 'svg';
      }

      this.changeCoordSvg = function(dragItem) {
        dragItem.$target.setAttribute('x', this.currentX + dragItem.initialX);
        dragItem.$target.setAttribute('y', this.currentY + dragItem.initialY);
      }

      this.changeCoordStyle = function(dragItem) {
        dragItem.$target.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;
      }

      this.equals = function($el) {
        return this.self.$target == $el;
      }

      this.destroy = function() {
        this.removeElements();
        this.offsetX = null;
        this.offsetY = null;
        this.currentX = null;
        this.currentY = null;
        this.startedX = null;
        this.startedY = null;
        this.initialX = null;
        this.initialY = null;
        this.option = null;
        this.self = null;
      }
  
      this.removeElements = function() {
        if (this.siblingItems.length <= 0) {
          return;
        }
        for (let item of this.siblingItems) {
          item.$target.remove();  
        }
        this.siblingItems = null;
      }

    }).call(Drag.prototype);

    return Drag;
  }()),

  
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

))));