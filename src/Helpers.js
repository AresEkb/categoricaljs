'use strict';

function assert(condition, message) {
  if (!condition) {
    throw message || 'Assertion failed';
  }
}

function assertEqualDom(f, g) {
  assert(f.dom().equals(g.dom()),
    'The following morphisms must have the same domain:\n' + f + ' and\n' + g);
}

function assertEqualCodom(f, g) {
  assert(f.codom().equals(g.codom()),
    'The following morphisms must have the same codomain:\n' + f + ' and\n' + g);
}

function assertParallel(f, g) {
  assert(f.dom().equals(g.dom()) && f.codom().equals(g.codom()),
    'The following morphisms must be parallel:\n' + f + ' and\n' + g);
}

function assertCommutes(f, g) {
  assert(f.commutes(g),
    'The following morphisms must commute:\n' + f + ' and\n' + g);
}

function throwNotImplemented() {
  throw 'Not implemented';
}

function isUndefined(x) { return typeof x == 'undefined'; }

function coalesce(x, def) { return isUndefined(x) ? def : x; }

function has(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);// && obj[prop];
}

// Based on
// http://javascript.ru/tutorial/object/inheritance
// http://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/
//
// Use this function only to extend classes, don't extend mixins.
// Mixins must be combined with combine function.
//
// TODO: Add duplicate and cycle detection
// TODO: It's difficult to distinguish classes and mixins.
//       Shoud we use prefix I for mixins?
function extend(Child, Parent, Mixins) {
  assert(arguments.length >= 2);
  assert(!has(Parent, '_mixins'));

  var F = function () { };
  F.prototype = Parent.prototype;

  var mixinList = [];
  for (var i = 2; i < arguments.length; i++) {
    var mixin = arguments[i];
    if (has(mixin.prototype, '_mixins')) {
      mixinList = mixinList.concat(mixin.prototype._mixins);
    }
    mixinList.push(mixin);
  }

  var CurrentBase = F;
  for (var i = 0; i < mixinList.length; i++) {
    var mixin = mixinList[i];
    var M = function () { };
    M.prototype = new CurrentBase();
    M.prototype.constructor = mixin;
    var proto = mixin.prototype;
    for (var prop in proto) {
      if (has(proto, prop)) {
        //assert(!has(M.prototype, prop), M + ' already has ' + prop + ' property');
        M.prototype[prop] = proto[prop];
      }
    }
    CurrentBase = M;
  }

  Child.prototype = new CurrentBase();
  Child.prototype.constructor = Child;
  Child.base = Parent.prototype;
}

// Mixins must be combined, not extended
function combine(MixinCombination, Mixins) {
  assert(arguments.length >= 2);
  var mixinList = [];
  for (var i = 1; i < arguments.length; i++) {
    mixinList.push(arguments[i]);
  }
  MixinCombination.prototype._mixins = mixinList;
}

var getObjectID = (function () {
  var id = 0;
  return function (obj) {
    if (obj.hasOwnProperty('__objectID__')) {
      return obj.__objectID__;
    }
    else {
      id++;
      Object.defineProperty(obj, '__objectID__', {
        'configurable': false,
        'enumerable':   false,
        'get': (function (__objectID__) {
          return function () { return __objectID__; };
        })(id),
        'set': function () {
          throw new Error('Sorry, but \'obj.__objectID__\' is read-only!');
        }
      });
      return obj.__objectID__;
    }
  };
})();

function hashCode(obj) {
  switch (typeof obj) {
    case 'number':
      return 'number{' + obj + '}';
    case 'string':
      return 'string{' + obj + '}';
    case 'object':
      return 'object{' + getObjectID(obj) + '}';
    default:
      throw new Error('Supported only numbers, strings and objects. \'' + typeof obj + '\' is not supported.');
  }
}

function equals(x, y) {
  var tx = typeof x;
  var ty = typeof y;
  if (tx != ty) return false;
  if (tx == 'object' && has(tx, 'equals')) return tx.equals(ty);
  return x === y;
}

function clone(obj, deep) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  var result = obj.constructor();
  for (var key in obj) {
    if (has(obj, key)) {
      result[key] = deep ? clone(obj[key], deep) : obj[key];
    }
  }
  return result;
}

function tryCastToInt(str) {
  var num = parseInt(str);
  return isNaN(num) || str != num ? str : num;
}

function quoteSetElement(element) {
  return typeof element == 'string' && element.indexOf(',') > -1
    ? '\'' + element.replace('\'', '\\\'') + '\'' : element;
}
