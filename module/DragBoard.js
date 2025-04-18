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
}((function DragBoardFactory(Drag) {
    'use strict'

    function DragBoard($el, option = {}) {     
      this.initialized = false;
      this.option = option;
      this.$board = $el;
      this.state = {
        drag: {
          active: false,
          el: null,
        },
      };
      this.draggable = {
        selectors: [],
        $elements: [],
        items: [],
      };
      this.mutationObserver = null;
      this.hooks = {};
      this.eventListeners = {};
      this.returnObject = this.createReturnObject();
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
        MOUSE: {
          ENTER: 'mouseenter',
          LEAVE: 'mouseleave',
        },
      };

      this.registerHook = function(eventType, hook) {
        this.hooks[eventType] = hook;
        return this.returnObject;
      }

      this.registerDragItemHook = function(eventType, hook) {
        
        this.hooks[eventType] = hook;
        return this.returnObject;
      }

      this.callHook = function(eventType, event = {}) {
        if (this.hooks[eventType]) {
          this.hooks[eventType]({ type: eventType, ...event });
        }
      }

      this.init = function() {
        this.initAllEventListener();
        this.bindBoardEventListeners();
        this.startDetectMutation();
        this.callHook(this.EVENT.LIFE_CYCLE.READY, {
          container: this.$board,
          draggable: this.draggable.$elements,
        });
        this.initialized = true;
      }

      this.startDetectMutation = function() {
        this.mutationObserver = new MutationObserver(this.mutationHandler.bind(this));
        this.mutationObserver.observe(this.$board, { childList: true, subtree: true });
      }

      this.mutationHandler = function(mutations) {
        mutations.forEach(mutation => {
          const { addedNodes, removedNodes, nextSibling, previousSibling } = mutation;
          
          if (this.isDraggableMatches(nextSibling)) {
            this.refreshSiblingElements(nextSibling);
            return;
          }
          
          if (this.isDraggableMatches(previousSibling)) {
            this.refreshSiblingElements(previousSibling);
            return;
          }

          addedNodes.forEach(addNode => this.toDraggable(addNode));
          removedNodes.forEach(removedNode => this.toUndraggable(removedNode));
        });
      };

      this.initAllEventListener = function() {
        this.eventListeners[this.EVENT.DRAG.START] = this.dragStartListener.bind(this);
        this.eventListeners[this.EVENT.DRAG.ING] = this.draggingListener.bind(this);
        this.eventListeners[this.EVENT.DRAG.END] = this.dragEndListener.bind(this);   
      }

      this.bindBoardEventListeners = function() {
        this.$board.addEventListener("touchstart", this.eventListeners[this.EVENT.DRAG.START], { passive: true });
        this.$board.addEventListener("touchmove", this.eventListeners[this.EVENT.DRAG.ING], { passive: true });
        this.$board.addEventListener("touchend", this.eventListeners[this.EVENT.DRAG.END], { passive: true });

        this.$board.addEventListener('mousedown', this.eventListeners[this.EVENT.DRAG.START]);
        this.$board.addEventListener('mousemove', this.eventListeners[this.EVENT.DRAG.ING]);
        this.$board.addEventListener('mouseup', this.eventListeners[this.EVENT.DRAG.END]);

        return this.returnObject;
      }

      this.getSelectedItem = function($selectedElement) {
        for (let item of this.draggable.items) {
          if (item.containsGroup($selectedElement)) {
            return item;
          }
        }
        return null;
      }

      this.startDrag = function(dragItem, clientCoord) {
        this.state.drag.active = true;
        this.state.drag.el = dragItem;
        this.state.drag.el.start(clientCoord); 
      }

      this.moveDrag = function(clientCoord) {
        this.state.drag.el.move(clientCoord);
      }

      this.endDrag = function() {
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

      this.toDraggableItems = function(selector) {
        const $els = this.$board.querySelectorAll(selector);
        if ($els.length <= 0) {
          return;
        }

        this.draggable.selectors.push(selector);
        
        for (let $el of $els) {
          this.toDraggable($el);
        }

        return this.returnObject;
      }

      this.toUndraggableItems = function(selector) {
        const $els = this.$board.querySelectorAll(selector);
        if ($els.length <= 0) {
          return;
        }

        for (let $el of $els) {
          this.toUndraggable($el);
        }

        const index = this.draggable.selectors.findIndex(s => s == selector);
        this.draggable.selectors.splice(index, 1);

        return this.returnObject;
      }

      this.isDraggableMatches = function($el) {
        if ($el == null) {
          return false;
        }
        if (typeof $el.matches !== 'function') {
          return false;
        }
        if (this.draggable.selectors.length === 0) {
          return false;
        }
        return this.draggable.selectors.every(selector => $el.matches(selector));
      }

      this.findDraggableItem = function($el) {
        return this.draggable.items.find(item => item.containsGroup($el));
      }

      this.refreshSiblingElements = function($el) {
        const item = this.findDraggableItem($el);

        if (item != null) {
          item.refreshSiblingElements();
        }
      }

      this.toDraggable = function($el) {
        if (!this.isDraggableMatches($el) || this.draggable.$elements.includes($el)) {
          return;
        }
        const dragItem = new Drag($el, this.option);

        dragItem.registerMouseEnterHook(function enterHandler(e) {
          this.callHook(this.EVENT.MOUSE.ENTER, {
            originEvent: e,
            target: e.target,
          });
        }.bind(this));

        dragItem.registerMouseLeaveHook(function leaveHandler(e) {
          this.callHook(this.EVENT.MOUSE.LEAVE, {
            originEvent: e,
            target: e.target,
          });
        }.bind(this));

        this.draggable.$elements.push($el);
        this.draggable.items.push(dragItem);
      }

      this.toUndraggable = function($el) {
        if (!this.isDraggableMatches($el)) {
          return;
        }
        const elementIndex = this.draggable.$elements.findIndex($element => $element == $el);
        const itemIndex = this.draggable.items.findIndex(item => item.containsGroup($el));

        if (elementIndex !== -1 && itemIndex !== -1) {
          this.draggable.$elements.splice(elementIndex, 1);
          this.draggable.items.splice(itemIndex, 1);
        }
      }

      this.dragStartListener = function(e) {
        const dragItem = this.getSelectedItem(e.target);
        if (dragItem == null) {
          return;
        }
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
        if (!this.isDragging()) {
          return;
        }
        this.callHook(this.EVENT.DRAG.END, {
          originEvent: e,
          target: this.currentDraggingElement(),
        });
        this.endDrag();
      }

      this.render = function() {
        if (!this.initialized) {
          this.init();
        }
        return this.returnObject;
      }

      this.destroy = function() {
        if (this.mutationObserver) {
          this.mutationObserver.disconnect();
        }
        this.mutationObserver = null;
        this.callHook(this.EVENT.LIFE_CYCLE.DESTROY, {
          container: this.$board,
          draggable: this.draggable.$elements,
        });
        this.removeElements();
        this.returnObject = null;
        this.eventListeners = null;
        this.draggable = null;
        this.hooks = null;
        this.state = null;
        this.$board = null;
        this.option = null;
        this.initialized = null;
      }

      this.removeElements = function() {
        this.draggable.$elements.forEach($el => {
          Object.values(this.EVENT).forEach(eventType => {
            if (this.eventListeners[eventType]) {
              $el.removeEventListener(eventType, this.eventListeners[eventType]);
            }
          });
        });
        this.draggable.items.forEach(item => item.destroy());
      }

      this.createReturnObject = function() {
        return {
          destroy: this.destroy.bind(this),
          onReady: this.registerHook.bind(this, this.EVENT.LIFE_CYCLE.READY),
          onDestroy: this.registerHook.bind(this, this.EVENT.LIFE_CYCLE.DESTROY),
          onDragStart: this.registerHook.bind(this, this.EVENT.DRAG.START),
          onDragging: this.registerHook.bind(this, this.EVENT.DRAG.ING),
          onDragEnd: this.registerHook.bind(this, this.EVENT.DRAG.END),
          onMouseEnter: this.registerDragItemHook.bind(this, this.EVENT.MOUSE.ENTER),
          onMouseLeave: this.registerDragItemHook.bind(this, this.EVENT.MOUSE.LEAVE),
          render: this.render.bind(this),
          draggable: this.toDraggableItems.bind(this),
          undraggable: this.toUndraggableItems.bind(this),
        };
      }
    }).call(DragBoard.prototype);

    return {
      on(selector, option) {
        const $board = document.querySelector(selector);
        if ($board == null) {
          console.error(`not found drag board container. '${selector}'`);
          return;
        }
        return new DragBoard($board, option);
      },
    };
}(

  (function DragFactory() {
    'use strict'

    function Drag($el, option = {}) {
      this.$group = null;
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

      this.eventListeners = {};
      this.hooks = {};

      this.init($el);

      return this.createReturnObject();
    }

    (function DragPrototype() {

      this.EVENT = {
        MOUSE: {
          ENTER: 'mouseenter',
          LEAVE: 'mouseleave',
        },
      };

      this.registerHook = function(eventType, hook) {
        this.hooks[eventType] = hook;
      }

      this.init = function($el) {
        if (this.option.grouping) {
          this.$group = this.wrapToGroup($el);
        } else {
          this.$group = $el;
        }

        this.self = this.toDragItem($el);

        const { x, y } = $el.getBoundingClientRect();
        this.initialX = x;
        this.initialY = y;
        this.startedX = x;
        this.startedY = y;
        this.currentX = x;
        this.currentY = y;

        this.initAllEventListener();
        this.bindHoverEventListener($el);
        this.setSiblingElements($el);
      }

      this.wrapToGroup = function($el) {
        const $parent = $el.parentElement;
        if ($parent.tagName === 'g') {
          return $parent;
        }
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        $el.parentElement.insertBefore(g, $el);
        g.appendChild($el);
        return g;
      }

      this.containsGroup = function($el) {
        return this.$group.contains($el);
      }

      this.refreshSiblingElements = function() {
        this.setSiblingElements(this.self.$target);
      }

      this.setSiblingElements = function($el) {
        if (!this.option.withSibling) {
          return;
        }
        this.siblingItems = [];

        const prevSiblings = this.getPrevSiblingAll($el);
        const nextSiblings = this.getNextSiblingAll($el);

        this.siblingItems.push(...prevSiblings);
        this.siblingItems.push(...nextSiblings);
        this.siblingItems.forEach(item => this.bindHoverEventListener(item.$target));
      }

      this.getPrevSiblingAll = function($el) {
        const prevSiblings = [];
        let $prev = $el;
        
        while($prev.previousElementSibling) {
          $prev = $prev.previousElementSibling;
          prevSiblings.push(this.toDragItem($prev));
        }
        return prevSiblings;
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
        this.changeCoordSiblings();
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

      this.changeCoordSiblings = function() {
        for (let siblingItem of this.siblingItems) {
          this.changeCoord(siblingItem);
        }
      }

      this.changeCoordSvg = function(dragItem) {
        dragItem.$target.setAttribute('x', this.currentX + dragItem.initialX);
        dragItem.$target.setAttribute('y', this.currentY + dragItem.initialY);
      }

      this.changeCoordStyle = function(dragItem) {
        dragItem.$target.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;
      }

      this.isSvg = function(dragItem) {
        return dragItem.$target.tagName === 'svg';
      }

      this.initAllEventListener = function() {
        this.eventListeners[this.EVENT.MOUSE.ENTER] = this.mouseEnterListener.bind(this);
        this.eventListeners[this.EVENT.MOUSE.LEAVE] = this.mouseLeaveListener.bind(this);
      }

      this.bindHoverEventListener = function($el) {
        $el.addEventListener('mouseenter', this.eventListeners[this.EVENT.MOUSE.ENTER]);
        $el.addEventListener('mouseleave', this.eventListeners[this.EVENT.MOUSE.LEAVE]);
      }

      this.releaseHoverEventListener = function($el) {
        $el.removeEventListener('mouseenter', this.eventListeners[this.EVENT.MOUSE.ENTER]);
        $el.removeEventListener('mouseleave', this.eventListeners[this.EVENT.MOUSE.LEAVE]);
      }

      this.mouseEnterListener = function(e) {
        if (this.hooks.mouseenter) {
          this.hooks.mouseenter({ originEvent: e, target: e.target });
        }
      }

      this.mouseLeaveListener = function(e) {
        if (this.hooks.mouseleave) {
          this.hooks.mouseleave({ originEvent: e, target: e.target });
        }
      }

      this.destroy = function() {
        this.removeElements();
        this.siblingItems = null;
        this.eventListeners = null;
        this.hooks = null;
        this.eventListeners = null;
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
        this.$group = null;
      }
  
      this.removeElements = function() {
        if (this.siblingItems.length > 0) {
          for (let item of this.siblingItems) {
            this.releaseHoverEventListener(this.$target);
            item.$target.remove();  
          }
        }

        this.releaseHoverEventListener(this.self.$target);

        if (this.$group != null) {
          this.$group.remove();
        }
      }

      this.getSelfElement = function() {
        return this.self.$target;
      }

      this.createReturnObject = function() {
        return {
          start: this.start.bind(this),
          move: this.move.bind(this),
          end: this.end.bind(this),
          containsGroup: this.containsGroup.bind(this),
          refreshSiblingElements: this.refreshSiblingElements.bind(this),
          destroy: this.destroy.bind(this),
          getSelf: this.getSelfElement.bind(this),
          registerMouseEnterHook: this.registerHook.bind(this, this.EVENT.MOUSE.ENTER),
          registerMouseLeaveHook: this.registerHook.bind(this, this.EVENT.MOUSE.LEAVE),
        };
      }

    }).call(Drag.prototype);

    return Drag;
  }()),

))));