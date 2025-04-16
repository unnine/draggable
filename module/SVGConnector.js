(function (factory) {
    if(typeof exports === 'object' && typeof module === 'object') {
      module.exports = factory;
    }
    else if(typeof define === 'function' && define.amd) {
      define([], factory);
    }
    else if(typeof exports === 'object') {
      exports["SVGConnector"] = factory;
    }
    else {
      window['SVGConnector'] = factory;
    }
  }((function SVGConnectorFactory(TextView) {
      'use strict'
  
      function SVGConnector($el) {
        this.$board = $el;
        this.$portsContainer = null;

        this.init();

        return this.createReturnObject();
      }
  
      (function SVGConnectorPrototype() {

        this.init = function() {
          this.$board.classList.add('svg-connector-container');
          this.createPortsContainer();
          this.createPorts();
        }

        this.ports = [];

        this.portCorrection = {
          minX: -5,
          minY: -1,
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
          coords: [{
            x: (x) => x + this.portCorrection.minX,
            y: (y) => y + this.portCorrection.minY,
          }, {
            x: (x, width) => x + this.portCorrection.midX(width),
            y: (y) => y + this.portCorrection.minY,
          }, {
            x: (x, width) => x + this.portCorrection.maxX(width),
            y: (y) => y + this.portCorrection.minY,
          }, {
            x: (x) => x + this.portCorrection.minX,
            y: (y, height) => y + this.portCorrection.midY(height),
          }, {
            x: (x, width) => x + this.portCorrection.maxX(width),
            y: (y, height) => y + this.portCorrection.midY(height),
          }, {
            x: (x) => x + this.portCorrection.minX,
            y: (y, height) => y + this.portCorrection.maxY(height),
          }, {
            x: (x, width) => x + this.portCorrection.midX(width),
            y: (y, height) => y + this.portCorrection.maxY(height),
          }, {
            x: (x, width) => x + this.portCorrection.maxX(width),
            y: (y, height) => y + this.portCorrection.maxY(height),
          }],
        }

        this.createPortsContainer = function() {
          const portsContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          portsContainer.classList.add('svg-connector-ports-container');
          this.$board.insertAdjacentElement('afterbegin', portsContainer);
          this.$portsContainer = portsContainer;
        }

        this.createPorts = function() {
          for (let i=0; i < 8; i++) {
            const coord = this.portCorrection.coords[i];
            const $port = this.createPort(coord.x(0, 0), coord.y(0, 0));
            this.ports.push({ $el: $port, coord });
            this.$portsContainer.insertAdjacentElement('beforeend', $port);
          }
        }

        this.createPort = function() {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.classList.add('connectable-icon');
          svg.setAttribute('width', '11');
          svg.setAttribute('height', '11');
          svg.setAttribute('viewBox', '0 0 512 512');
          svg.setAttribute('x', -11);
          svg.setAttribute('y', -11);
  
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

        this.toConnectable = function($el) {
          if (this.isConnectable($el)) {
            return;
          }
          $el.classList.add('svg-connectable');
          this.movePorts($el.getBoundingClientRect());
        }

        this.toUnconnectable = function($el) {
          if (!this.isConnectable($el)) {
            return;
          }
          $el.classList.remove('svg-connectable');
          this.movePorts({ x: -10, y: -10, width: 0, height: 0 });
        }

        this.refresh = function($el) {
          if (!this.isConnectable($el)) {
            return;
          }
          this.movePorts($el.getBoundingClientRect());
        }

        this.movePorts = function({ x, y, width, height }) {
          this.ports.forEach(({ $el, coord }) => {
            $el.setAttribute('x', coord.x(x, width));
            $el.setAttribute('y', coord.y(y, height));
          });
        }

        this.isConnectable = function($el) {
          return $el != null && $el.classList.contains('svg-connectable');
        }

        this.createReturnObject = function() {
          return {
            toConnectable: this.toConnectable.bind(this),
            toUnconnectable: this.toUnconnectable.bind(this),
            refresh: this.refresh.bind(this),
          };
        }

      }).call(SVGConnector.prototype);
  
      return {
        on(selector) {
          const $board = document.querySelector(selector);
          if ($board == null) {
            console.error(`not found connectable board container. '${selector}'`);
            return;
          }
          return new SVGConnector($board);
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
  
  ))));