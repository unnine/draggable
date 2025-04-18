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
}((function SVGWritableFactory(TextView) {
    'use strict'

    function SVGWritable($el) {
      this.$svg = $el;
      this.store = {};

      this.init();

      this.returnObject = this.createReturnObject();
      return this.returnObject;
    }

    (function SVGWritablePrototype() {

      this.init = function() {
        this.$svg.classList.add('svg-writable-container');
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
        this.store[name] = new TextView($el, name, value);

        return this.returnObject;
      }

      this.destroy = function() {
        this.store = null;
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

    function TextView($el, name, value) {
      this.$target = null;
      this.name = null;
      this.value = null;
      this.$group = null;
      this.view = {
        $fo: null,
        $wrap: null,
        $el: null,
      };

      this.init($el, name, value);

      return this.createReturnObject();
    }

    (function TextViewPrototype() {

      this.getName = function() {
        return this.name;
      }

      this.getValue = function() {
        return this.value;
      }

      this.init = function($el, name, value) {
        if (name == null) {
          throw new Error('name attribute is required.');
        }

        this.$target = $el;
        this.name = name;
        this.value = value; 
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
        fo.style.overflow = 'visible';
        fo.setAttribute('x', x);
        fo.setAttribute('y', y);
        fo.setAttribute('width', width);
        fo.setAttribute('height', height);

        const viewWrap = document.createElement('div');
        viewWrap.classList.add('text-view-wrap');
        viewWrap.style.width = `${width}px`;
        viewWrap.style.height = `${height}px`;

        const view = document.createElement('pre');
        view.classList.add('text-view');
        view.contentEditable = 'true';
        view.innerText = this.value;
        view.addEventListener('keydown', this.onInputValue);
        view.addEventListener('blur', this.onBlurInput);

        viewWrap.appendChild(view);
        fo.appendChild(viewWrap);
        this.$group.insertAdjacentElement('beforeend', fo);

        return {
          $fo: fo,
          $wrap: viewWrap,
          $el: view,
        };
      }

      this.onInputValue = function(e) {
        if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault();
          e.target.blur();
        }
      }

      this.onBlurInput = function(e) {
        this.value = e.target.innerText;
      }

      this.destroy = function() {
        this.removeViewElements();
        this.view = null;
        this.$group.remove();
        this.$group = null;
        this.$target = null;
        this.name = null;
        this.value = null;
      }

      this.removeViewElements = function() {
        this.view.$el.removeEventListener('keydown', this.onInputValue);
        this.view.$el.removeEventListener('blur', this.onBlurInput);
        this.view.$fo.remove();
        this.view.$wrap.remove();
        this.view.$el.remove();
        this.view.$fo = null;
        this.view.$wrap = null;
        this.view.$el = null;
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

))));