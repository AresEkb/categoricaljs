/////////////////////////////////////////////////////////////////////////////
// Relation

function Relation() {
  var _rel = {};

  this.add = function (source, target) {
    assert(isUndefined(_rel[source]) || _rel.hasOwnProperty(source), 'Trying to set an inherited property \'' + source + '\'');
//    assert(this.dom().contains(source), 'Element \'' + source + '\' must be contained in a domain ' + this.dom());
//    assert(this.codom().contains(target), 'Element \'' + target + '\' must be contained in a codomain ' + this.codom());
    if (isUndefined(_rel[source])) {
      _rel[source] = new Set();
    }
    _rel[source].add(target);
  };

  this.elements = function () {
    var arr = [];
    for (source in _rel) {
      if (_rel.hasOwnProperty(source)) {
        var targetSet = _rel[source].elements();
        for (var i in targetSet) {
          arr.push([tryCastToInt(source), targetSet[i]]);
        }
      }
    }
    return arr;
  };

  this.forEach = function (f) {
    var sourceSet = [];
    for (var source in _rel) {
      if (_rel.hasOwnProperty(source)) {
        var targetSet = _rel[source].elements();
        for (var j in targetSet) {
          f(tryCastToInt(source), targetSet[j]);
        }
      }
    }
/*
    // We need to collect all sources before loop to let nested forEach work
    var sourceSet = [];
    for (var source in _rel) {
      if (_rel.hasOwnProperty(source)) {
        sourceSet.push(source);
      }
    }
    for (var i in sourceSet) {
      var targetSet = _rel[sourceSet[i]].elements();
      for (var j in targetSet) {
        f(tryCastToInt(sourceSet[i]), targetSet[j]);
      }
    }*/
  };

  this.toFunction = function () {
    var rmDom = new Set(), rmCodom = new Set();
    var repMap = new TotalFunction(null, rmDom, rmCodom);
    var dom = new Set(), codom = new Set();
    var f = new TotalFunction(null, dom, codom);
    var elementCount = 1;
    for (var source in _rel) {
      if (_rel.hasOwnProperty(source)) {
        var s = tryCastToInt(source);
        var t;
        var representative = _rel[source].representative();
        var image = repMap.image(representative);
        if (!isUndefined(image)) {
          t = image;
        }
        else {
          t = elementCount++;
          rmDom.add(representative);
          rmCodom.add(t);
          repMap.push(representative, t);
        }
        dom.add(s);
        codom.add(t);
        f.push(s, t);
      }
    }
    return f;
  };
/*
  this.clone = function () {
    var copy = this.constructor();
    for (var attr in this) {
      if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
  };
*/
  this.toString = function () {
    return '{' + this.elements().map(function (m) { return '(' + m.join() + ')'; }).join() + '}';
  };
}
/*
function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}
*/
