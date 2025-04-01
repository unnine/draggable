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
}((function SVGConnectorFactory(Drag) {

    function SVGConnector() {}

    (function SVGConnectorProtorype() {

      this.coord = {
        minX: -9,
        minY: -9,
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
        $element.insertAdjacentElement('afterend', this.createConnectPortElement(x, y, this.coord.maxX, this.coord.minY));
        $element.insertAdjacentElement('afterend', this.createConnectPortElement(x, y, this.coord.minX, this.coord.midY(height)));
        $element.insertAdjacentElement('afterend', this.createConnectPortElement(x, y, this.coord.maxX, this.coord.midY(height)));
        $element.insertAdjacentElement('afterend', this.createConnectPortElement(x, y, this.coord.minX, this.coord.maxY));
        $element.insertAdjacentElement('afterend', this.createConnectPortElement(x, y, this.coord.midX(width), this.coord.maxY));
        $element.insertAdjacentElement('afterend', this.createConnectPortElement(x, y, this.coord.maxX, this.coord.maxY));
      }

      this.createConnectPortElement = function(x, y, correctionX, correctionY) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '13');
        svg.setAttribute('height', '13');
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
}())));