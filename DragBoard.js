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
}((function DragBoardFactory(Drag, SVGConnector) {

    function DragBoard(selector) {
      this.$board = document.querySelector(selector);
      this.dragElements = [];

      this.active = false;
      this.$activeElement = null;

      this.externalEventListeners = {
        [this.EVENT.DRAG_START]: null,
        [this.EVENT.DRAGGING]: null,
        [this.EVENT.DRAG_END]: null,
      }
      this.eventListeners = {};
      this.bindEventListeners();

      this.returnObject = this.returnObject();

      return this.returnObject;
    }

    (function DragBoardPrototype() {

      this.EVENT = {
        DRAG_START: 'dragStart',
        DRAG_END: 'dragEnd',
        DRAGGING: 'dragging',
      };

      this.getDragElementBySelected = function($selectedElement) {
        for (let element of this.dragElements) {
          if (element.equals($selectedElement)) {
            return element;
          }
        }
        return null;
      }

      this.dragStart = function(e) {        
        const dragElement = this.getDragElementBySelected(e.target);

        if (dragElement != null) {
          this.active = true;
          this.$activeElement = dragElement;
          this.$activeElement.moveStart(this.clientX(e), this.clientY(e)); 
        }
        this.publishExternalEventListener(this.EVENT.DRAG_START, e);
      }

      this.dragging = function(e) {
        if (!this.active) {
          return;
        }
        if (this.$activeElement == null) {
          return;
        }
        e.preventDefault();
        this.$activeElement.move(this.clientX(e), this.clientY(e));
        this.publishExternalEventListener(this.EVENT.DRAGGING, e);
      }

      this.dragEnd = function(e) {
        this.active = false;

        if (this.$activeElement != null) {
          this.$activeElement.moveEnd();
          this.$activeElement = null;
        }
        this.publishExternalEventListener(this.EVENT.DRAG_END, e);
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

      this.isTouched = function(e) {
        return e.type.startsWith('touch');
      }

      this.draggable = function(selector, dragOption) {
        const elements = this.$board.querySelectorAll(selector);
        if (elements.length <= 0) {
          return;
        }
        for (let element of elements) {
          SVGConnector.toConnectable(selector);
          this.dragElements.push(new Drag(element, dragOption));
        }
        return this.returnObject;
      }
      
      this.bindEventListeners = function() {
        this.eventListeners = {
          dragStart: this.dragStart.bind(this),
          dragging: this.dragging.bind(this),
          dragEnd: this.dragEnd.bind(this),
        };

        this.$board.addEventListener("touchstart", this.eventListeners.dragStart);
        this.$board.addEventListener("touchmove", this.eventListeners.dragging);
        this.$board.addEventListener("touchend", this.eventListeners.dragEnd);

        this.$board.addEventListener('mousedown', this.eventListeners.dragStart);
        this.$board.addEventListener('mousemove', this.eventListeners.dragging);
        this.$board.addEventListener('mouseup', this.eventListeners.dragEnd);

        return this.returnObject;
      }

      this.releaseEventListeners = function() {
        this.$board.removeEventListener("touchstart", this.eventListeners.dragStart);
        this.$board.removeEventListener("touchmove", this.eventListeners.dragging);
        this.$board.removeEventListener("touchend", this.eventListeners.dragEnd);
        this.$board.removeEventListener("touchcancel", this.eventListeners.dragEnd);

        this.$board.removeEventListener('mousedown', this.eventListeners.dragStart);
        this.$board.removeEventListener('mousemove', this.eventListeners.dragging);
        this.$board.removeEventListener('mouseup', this.eventListeners.dragEnd);
        this.$board.removeEventListener('mouseleave', this.eventListeners.dragEnd);

        this.eventListeners = null;
      }

      this.registerDragStartListener = function (listener) {
        this.externalEventListeners.dragStart = listener;
        return this.returnObject;
      }

      this.registerDragEndListener = function (listener) {
        this.externalEventListeners.dragEnd = listener;
        return this.returnObject;
      }

      this.registerDraggingListener = function (listener) {
        this.externalEventListeners.dragging = listener;
        return this.returnObject;
      }

      this.publishExternalEventListener = function(eventType, event) {
        if (this.externalEventListeners[eventType] == null) {
          return;
        }
        this.externalEventListeners[eventType]({ eventType, event });
      }

      this.destroy = function() {
        this.active = null;
        this.returnObject = null;
        this.externalEventListeners = null;
        this.releaseEventListeners();
        this.removeElements();
      }

      this.removeElements = function() {
        for (let element of this.dragElements) {
          element.destroy();
        }
        this.$activeElement = null;
        this.dragElements = null;
        this.$board.remove();
        this.$board = null;
      }

      this.returnObject = function() {
        return {
          draggable: this.draggable.bind(this),
          destroy: this.destroy.bind(this),
          onDragStart: this.registerDragStartListener.bind(this),
          onDragEnd: this.registerDragEndListener.bind(this),
          onDragging: this.registerDraggingListener.bind(this),
        };
      }
    }).call(DragBoard.prototype);

    return {
      on(selectorId) {
        return new DragBoard(selectorId);
      },
    };
}(

  (function DragFactory() {

    function Drag($element, option = {}) {
      this.dragElements = [];
      this.option = option;

      this.dragElements.push(this.makeDragElement($element));

      const { x, y } = $element.getBoundingClientRect();

      this.initialX = x;
      this.initialY = y;

      this.startedX = x;
      this.startedY = y;

      this.currentX = x;
      this.currentY = y;
      
      this.offsetX = 0;
      this.offsetY = 0;

      this.setSiblingElements($element);
    }

    (function DragPrototype() {

      this.setSiblingElements = function($element) {
        if (!this.option.withSibling) {
          return;
        }
        const nextSiblings = this.getNextSiblingAll($element);
        const prevSiblings = this.getprevSiblingAll($element);
        this.dragElements.push(...prevSiblings);
        this.dragElements.push(...nextSiblings);
      }

      this.getNextSiblingAll = function($element) {
        const nextSiblings = [];
        let $e = $element;
        
        while($e.nextElementSibling) {
          $e = $e.nextElementSibling;
          nextSiblings.push(this.makeDragElement($e));
        }
        return nextSiblings;
      }

      this.getprevSiblingAll = function($element) {
        const prevSiblings = [];
        let $e = $element;
        
        while($e.prevElementSibling) {
          $e = $e.prevElementSibling;
          prevSiblings.push(this.makeDragElement($e));
        }
        return prevSiblings;
      }

      this.makeDragElement = function($element) {
        const { x, y } = $element.getBoundingClientRect();
        return { $target: $element, initialX: x, initialY: y };
      }

      this.equals = function($element) {
        return this.dragElements[0].$target == $element;
      }

      this.destroy = function() {
        if (this.dragElements.length <= 0) {
          return;
        }
        for (let dragElement of this.dragElements) {
          dragElement.$target.remove();  
        }
        this.dragElements = null;
        this.option = null;
        this.startedX = null;
        this.startedY = null;
        this.currentX = null;
        this.currentY = null;
        this.offsetX = null;
        this.offsetY = null;
      }

      this.moveStart = function(clientX, clientY) {
        const { x, y } = this.getCoordinate(clientX, clientY);
        this.startedX = x - this.offsetX;
        this.startedY = y - this.offsetY;
      }

      this.move = function(clientX, clientY) {
        const { x, y } = this.getCoordinate(clientX, clientY);
        this.currentX = x - this.startedX;
        this.currentY = y - this.startedY;

        this.offsetX = this.currentX;
        this.offsetY = this.currentY;

        for (let element of this.dragElements) {
          if (this.isSvg(element)) {
            this.coordinate(element);
            continue;
          }
          this.translate(element);
        }
      }

      this.moveEnd = function() {
        this.startedX = this.currentX;
        this.startedY = this.currentY;
      }

      this.isSvg = function(dragElement) {
        return dragElement.$target.tagName === 'svg';
      }

      this.getCoordinate = function(clientX, clientY) {
        if (this.option.svg) {
          const CTM = this.dragElements[0].$target.getScreenCTM();
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

      this.coordinate = function(element) {
        element.$target.setAttribute('x', this.currentX + element.initialX);
        element.$target.setAttribute('y', this.currentY + element.initialY);
      }

      this.translate = function(element) {
        element.$target.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;
      }
    }).call(Drag.prototype);

    return Drag;
  }()),


  (function SVGConnectorFactory() {

    function SVGConnector() {}

    (function SVGConnectorProtorype() {

      this.coord = {
        minX: -5,
        minY: -5,
        maxX: function(width) {
          return this.minX + width;
        },
        maxY: function(height) {
          return this.minY + height;
        },
        midX: function(width) {
          return (this.minX / 2) + (this.maxX(width) / 2);
        },
        midY: function(height) {
          return (this.minY / 2) + (this.maxY(height) / 2);
        },
      }

      this.toConnectable = function($element) {
        const { x, y, width, height } = $element.getBoundingClientRect();

        $element.classList.add('svg-connectable');
        $element.insertAdjacentElement('afterend', this.createConnectPortElement(x, y, this.coord.minX, this.coord.minY));
        $element.insertAdjacentElement('afterend', this.createConnectPortElement(x, y, this.coord.midX(width), this.coord.minY));
        $element.insertAdjacentElement('afterend', this.createConnectPortElement(x, y, this.coord.maxX(width), this.coord.minY));
        $element.insertAdjacentElement('afterend', this.createConnectPortElement(x, y, this.coord.minX, this.coord.midY(height)));
        $element.insertAdjacentElement('afterend', this.createConnectPortElement(x, y, this.coord.maxX(width), this.coord.midY(height)));
        $element.insertAdjacentElement('afterend', this.createConnectPortElement(x, y, this.coord.minX, this.coord.maxY(height)));
        $element.insertAdjacentElement('afterend', this.createConnectPortElement(x, y, this.coord.midX(width), this.coord.maxY(height)));
        $element.insertAdjacentElement('afterend', this.createConnectPortElement(x, y, this.coord.maxX(width), this.coord.maxY(height)));
      }

      this.createConnectPortElement = function(x, y, correctionX, correctionY) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('connectable-icon');
        svg.setAttribute('width', '11');
        svg.setAttribute('height', '11');
        svg.setAttribute('viewBox', '0 0 512 512');
        svg.setAttribute('x', Number(x) + correctionX);
        svg.setAttribute('y', Number(y) + correctionY);

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        linearGradient.setAttribute('id', 'grad1');
        linearGradient.setAttribute('x1', '0');
        linearGradient.setAttribute('x2', '0');
        linearGradient.setAttribute('y1', '0');
        linearGradient.setAttribute('y2', '1');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', 'lime');
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', 'blue');

        linearGradient.appendChild(stop1);
        linearGradient.appendChild(stop2);

        defs.appendChild(linearGradient);
        svg.appendChild(defs);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '256');
        circle.setAttribute('cy', '256');
        circle.setAttribute('r', '256');
        circle.setAttribute('fill', 'url(#grad1)');

        svg.appendChild(circle);

        return svg;
      }
    }).call(SVGConnector.prototype);

    return {
      toConnectable(selector) {
        const $elements = document.querySelectorAll(selector);
        
        for (let $element of $elements) {
          SVGConnector.prototype.toConnectable($element);
        }
      },
    };
  }()),

))));