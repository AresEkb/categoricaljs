'use strict';

// TODO: Remove tryCastToInt?
// TODO: Use custom Set implementation only if Set from ES6 isn't supported.

/////////////////////////////////////////////////////////////////////////////
// SetCategory

function SetCategory() {
}

extend(SetCategory, Category, BicompleteCategory);

SetCategory.prototype.object = function (elements) {
  return new Set(elements);
};

SetCategory.prototype.morphism = function (A, B, mapping) {
  return new TotalFunction(A, B, mapping);
};

SetCategory.prototype.id = function (A) {
  return this.morphism(A, A).initId();
};

SetCategory.prototype.compose = function (g, f) {
  return g.compose(f);
};

SetCategory.prototype.terminal = function () {
  return new SetTerminalObject(this).calculate();
};

SetCategory.prototype.initial = function () {
  return new SetInitialObject(this).calculate();
};

SetCategory.prototype.product = function (A, B) {
  return new SetProduct(this).calculate(A, B);
};

SetCategory.prototype.coproduct = function (A, B) {
  return new SetCoproduct(this).calculate(A, B);
};

SetCategory.prototype.coproductComplement = function (f) {
  return new SetCoproduct(this).complement(f);
};

SetCategory.prototype.equalizer = function (f, g) {
  return new SetEqualizer(this).calculate(f, g);
};

SetCategory.prototype.coequalizer = function (f, g) {
  return new SetCoequalizer(this).calculate(f, g);
};

/////////////////////////////////////////////////////////////////////////////
// Set

function Set(elements) {
  this._set = {};

  if (!isUndefined(elements)) {
    this.addAll(elements);
  }
}

Set.prototype.contains = function (element) {
  return has(this._set, hashCode(element));
};

Set.prototype.add = function (element) {
  var id = hashCode(element);
  assert(!this.contains(id));
  this._set[id] = element;
};

Set.prototype.addAll = function (elements) {
  assert(elements instanceof Array);
  for (var i = 0; i < elements.length; i++) {
    this.add(elements[i]);
  }
};

Set.prototype.getNextId = function () {
  var elements = this.elements();
  for (var i = elements.length - 1; i >= 0; i--) {
    if (typeof elements[i] == 'number') {
      return elements[i] + 1;
    }
  }
  return 1;
};

Set.prototype.ordinal = function (element) {
  var i = 0;
  for (var prop in this._set) {
    if (has(this._set, prop) && prop == hashCode(element)) {
      return i;
    }
    i++;
  }
};

Set.prototype.addNext = function () {
  var id = this.getNextId();
  this.add(id);
  return id;
};

Set.prototype.remove = function (element) {
  delete this._set[hashCode(element)];
};

Set.prototype.removeAll = function (elements) {
  assert(elements instanceof Array);
  for (var i = 0; i < elements.length; i++) {
    this.remove(elements[i]);
  }
};

Set.prototype.diff = function (s) {
  var res = new Set(this.elements());
  res.removeAll(s.elements());
  return res;
};

Set.prototype.union = function (s) {
  var res = new Set(this.elements());
  res.addAll(s.elements());
  return res;
};

Set.prototype.intersection = function (s) {
  var res = new Set();
  this.forEach(function (x) {
    if (s.contains(x)) {
      res.add(x);
    }
  });
  return res;
};

Set.prototype.clear = function () {
  this._set = {};
};

Set.prototype.isEmpty = function () {
  return this.size() > 0 ? false : true;
};

Set.prototype.isSubsetOf = function (s) {
  return this.every(s.contains, s);
};

Set.prototype.hasIntersectionWith = function (s) {
  return this.some(s.contains, s);
};

Set.prototype.equals = function (s) {
  var elements1 = this.elements();
  var elements2 = s.elements();
  if (elements1.length != elements2.length) return false;
  for (var i = 0; i < elements1.length; i++) {
    if (!equals(elements1[i], elements2[i])) return false;
  }
  return true;
};

Set.prototype.elements = function () {
  var keys = [];
  for (var key in this._set) {
    if (has(this._set, key)) {
      keys.push(key);
    }
  }
  keys.sort();
  var arr = [];
  for (var i = 0; i < keys.length; i++) {
    arr.push(this._set[keys[i]]);
  }
  return arr;
};

Set.prototype.forEach = function (callback, context) {
  assert(typeof callback == 'function');
  var f = isUndefined(context)
    ? function (item) { callback(item); }
    : function (item) { callback.call(context, item); };
  for (var prop in this._set) {
    if (has(this._set, prop)) {
      f(this._set[prop]);
    }
  }
};

Set.prototype.every = function (callback, context) {
  assert(typeof callback == 'function');
  var f = isUndefined(context)
    ? function (item) { return callback(item); }
    : function (item) { return callback.call(context, item); };
  for (var prop in this._set) {
    if (has(this._set, prop)) {
      if (!f(this._set[prop])) return false;
    }
  }
  return true;
};

Set.prototype.some = function (callback, context) {
  assert(typeof callback == 'function');
  var f = isUndefined(context)
    ? function (item) { return callback(item); }
    : function (item) { return callback.call(context, item); };
  for (var prop in this._set) {
    if (has(this._set, prop)) {
      if (f(this._set[prop])) return true;
    }
  }
  return false;
};

Set.prototype.representative = function () {
  for (var prop in this._set) {
    if (has(this._set, prop)) {
      return this._set[prop];
    }
  }
};

Set.prototype.random = function (callback, context) {
  // TODO: I hope it could be more effective
  assert(typeof callback == 'function');
  var f = isUndefined(context)
    ? function (item) { return callback(item); }
    : function (item) { return callback.call(context, item); };
  var last;
  var count = 0;
  for (var prop in this._set) {
    if (has(this._set, prop)) {
      if (f(prop)) {
        if (Math.round(Math.random() * count++) === 0) {
          last = prop;
        }
      }
    }
  }
  if (!isUndefined(last)) {
    return this._set[last];
  }
};

Set.prototype.size = function () {
  return this.elements().length;
};

Set.prototype.toString = function () {
  return '{' + this.elements().map(quoteSetElement).join() + '}';
};

/////////////////////////////////////////////////////////////////////////////
// TotalFunction

function TotalFunction(dom, codom, mapping) {
  assert(dom instanceof Set, 'Domain must be a Set');
  assert(codom instanceof Set, 'Codomain must be a Set');

  this._mapping = {};

  this.dom = function () { return dom; };

  this.codom = function () { return codom; };

  if (!isUndefined(mapping)) {
    assert(mapping instanceof Object, 'Mapping must be an Object');
    for (var prop in mapping) {
      if (has(mapping, prop)) {
        this.push(tryCastToInt(prop), mapping[prop]);
      }
    }
  }
}

// TODO: What's the difference between equals and commutes?
TotalFunction.prototype.equals = function (f) {
  assert(this.isTotal() && f.isTotal());
  if (!this.dom().equals(f.dom()) || !this.codom().equals(f.codom())) {
    return false;
  }
  var elements1 = this.elements();
  var elements2 = f.elements();
  for (var i in elements1) {
    if (has(elements1, i) && has(elements2, i)) {
      if (elements1[i] !== elements2[i]) return false;
    }
    else if (has(elements1, i) || has(elements2, i)) {
      return false;
    }
  }
  return true;
};

TotalFunction.prototype.forEach = function (f) {
  for (var prop in this._mapping) {
    if (has(this._mapping, prop)) {
      f(tryCastToInt(prop), this._mapping[prop]);
    }
  }
};

// TODO: Use forEach
TotalFunction.prototype.elements = function () {
  return this._mapping;
};

TotalFunction.prototype.image = function (source) {
  if (!isUndefined(source)) {
    if (has(this._mapping, source)) {
      return this._mapping[source];
    }
  }
  else {
    var image = new Set();
    for (var prop in this._mapping) {
      if (has(this._mapping, prop)) {
        image.add(this._mapping[prop]);
      }
    }
    return image;
  }
};

TotalFunction.prototype.imageComplement = function () {
  return new Set(this.codom().diff(this.image()));
};

TotalFunction.prototype.preimage = function (target) {
  var preimage = new Set();
  for (var prop in this._mapping) {
    if (has(this._mapping, prop) && (isUndefined(target) || this._mapping[prop] === target)) {
      preimage.add(tryCastToInt(prop));
    }
  }
  return preimage;
};

TotalFunction.prototype.push = function (source, target) {
  assert(this.dom().contains(source),
    'Element \'' + source + '\' must be contained in a domain ' + this.dom());
  assert(this.codom().contains(target),
    'Element \'' + target + '\' must be contained in a codomain ' + this.codom());
  this._mapping[source] = typeof target == 'number' ? target : target.toString();
};

TotalFunction.prototype.compose = function (f) {
  assert(this.dom().equals(f.codom()),
    'The first morphism\' dom must be equal to the second morphism\' codom');
  var h = new TotalFunction(f.dom(), this.codom());
  for (var prop in f._mapping) {
    if (has(f._mapping, prop)) {
      h.push(tryCastToInt(prop), this.image(f._mapping[prop]));
    }
  }
  return h;
};

// TODO: Maybe partial functions must be separated out?
// TODO: Reverse order of functions?
TotalFunction.prototype.composePartial = function (f) {
  //console.log('==', this.codom().toString(), f.dom().toString());
  assert(f.dom().isSubsetOf(this.codom()));
  var h = new TotalFunction(this.dom(), f.codom());
  for (var prop in this._mapping) {
    if (has(this._mapping, prop)) {
      var t = f.image(this._mapping[prop]);
      assert(!isUndefined(t));
      h.push(tryCastToInt(prop), t);
    }
  }
  return h;
};

TotalFunction.prototype.complement = function (f) {
  assert(this.dom().equals(f.dom()));
  assert(this.isTotal());
  assert(f.isTotal());
  var g = new TotalFunction(this.codom(), f.codom());
  this.dom().forEach(function (x) {
    g.push(this.image(x), f.image(x));
  }.bind(this));
  assert(g.isTotal());
  assertCommutes(g.compose(this), f);
  return g;
};

TotalFunction.prototype.union = function (f) {
  assert(!this.dom().hasIntersectionWith(f.dom()));
  var mapping = {};
  this.forEach(function (s, t) { mapping[s] = t; });
  f.forEach(function (s, t) { mapping[s] = t; });
  return new TotalFunction(this.dom().union(f.dom()), this.codom().union(f.codom()), mapping);
};

TotalFunction.prototype.decomposeToEM = function () {
  var image = this.image();
  var e = new TotalFunction(this.dom(), image, this._mapping);
  var m = new TotalFunction(image, this.codom()).initId();
  return {'e': e, 'm': m};
};

TotalFunction.prototype.commutes = function(f) {
  assert(this.dom().equals(f.dom()) && this.codom().equals(f.codom()),
    'Morphisms must has the same domain and codomain');
  assert(this.isTotal() && f.isTotal(),
    'Morphisms must be a total functions');
  return this.preimage().every(function (x) {
    return this.image(x) === f.image(x);
  }.bind(this));
};

TotalFunction.prototype.inv = function () {
  // TODO: Why? I think it must be bijective
  assert(this.isMono(), 'Only a monomorphism has an inversion');
  var f = new TotalFunction(this.codom(), this.dom());
  for (var prop in this._mapping) {
    if (has(this._mapping, prop)) {
      f.push(this._mapping[prop], tryCastToInt(prop));
    }
  }
  return f;
};

// TODO: It's an automorphism
TotalFunction.prototype.initId = function () {
  var dom = this.dom();
  var codom = this.codom();
  assert(dom.isSubsetOf(codom), 'Domain ' + dom + ' must be a subset of a codomain ' + codom);
  this._mapping = {};
  dom.forEach(function (x) { this.push(x, x); }.bind(this));
  return this;
};

TotalFunction.prototype.isId = function () {
  return this.dom().equals(this.codom()) && this.isIso();
};

// TODO: Rename to isInjective? For now TotalFunction implements
//       two interfaces: function and morphism.
TotalFunction.prototype.isMono = function () {
  var image = new Set();
  for (var prop in this._mapping) {
    if (has(this._mapping, prop)) {
      if (image.contains(this._mapping[prop])) return false;
      image.add(this._mapping[prop]);
    }
  }
  return true;
};

TotalFunction.prototype.isEpi = function () {
  return this.codom().equals(this.image());
};

TotalFunction.prototype.isIso = function () {
  return this.isMono() && this.isEpi();
};

TotalFunction.prototype.isTotal = function () {
  return this.dom().equals(this.preimage());
};

TotalFunction.prototype.toString = function () {
  var arr = [];
  for (var prop in this._mapping) {
    if (has(this._mapping, prop)) {
      arr.push('(' + quoteSetElement(prop) + ',' + quoteSetElement(this._mapping[prop]) + ')');
    }
  }
  return this.dom() + ' -> ' + this.codom() + ' = {' + arr.join() + '}';
};

/////////////////////////////////////////////////////////////////////////////
// SetTerminalObject

function SetTerminalObject(cat) {
  this.cat = function () { return cat; };
}

SetTerminalObject.prototype.calculate = function () {
  this.obj = new Set([1]);
  return this;
}

SetTerminalObject.prototype.univ = function (A) {
  var mapping = {};
  A.forEach(function (el) {
    mapping[el] = 1;
  });
  return this.cat().morphism(A, this.obj, mapping);
}

SetTerminalObject.prototype.toString = function () {
  return this.obj.toString();
};

/////////////////////////////////////////////////////////////////////////////
// SetInitialObject

function SetInitialObject(cat) {
  this.cat = function () { return cat; };
}

SetInitialObject.prototype.calculate = function () {
  this.obj = new Set();
  return this;
}

SetInitialObject.prototype.univ = function (A) {
  return this.cat().morphism(this.obj, A, {});
}

SetInitialObject.prototype.toString = function () {
  return this.obj.toString();
};

/////////////////////////////////////////////////////////////////////////////
// SetProduct

function SetProduct(cat) {
  this.cat = function () { return cat; };
}

SetProduct.prototype.calculate = function (A, B) {
  var obj = new Set();
  var mapping1 = {};
  var mapping2 = {};
  A.forEach(function (x) {
    B.forEach(function (y) {
      var z = [x, y].toString();
      obj.add(z);
      mapping1[z] = x;
      mapping2[z] = y;
    });
  });
  this.obj = obj;
  this.f = this.cat().morphism(this.obj, A, mapping1);
  this.g = this.cat().morphism(this.obj, B, mapping2);
  return this;
};

SetProduct.prototype.univ = function(m, n) {
  assertEqualDom(m, n);
  assertEqualCodom(this.f, m);
  assertEqualCodom(this.g, n);
  var obj = m.dom();
  var mapping = {};
  obj.forEach(function (x) {
    var s1 = this.f.preimage(m.image(x));
    var s2 = this.g.preimage(n.image(x));
    mapping[x] = s1.intersection(s2).representative();
  }.bind(this));
  var u = this.cat().morphism(obj, this.obj, mapping);
  assertCommutes(this.f.compose(u), m);
  assertCommutes(this.g.compose(u), n);
  return u;
};

SetProduct.prototype.toString = function () {
  return '<AxB: ' + this.obj + ', f: ' + this.f + ', g: ' + this.g + '>';
};

/////////////////////////////////////////////////////////////////////////////
// SetCoproduct

function SetCoproduct(cat) {
  this.cat = function () { return cat; };
}

SetCoproduct.prototype.calculate = function (A, B) {
  this.obj = new Set();
  var elementCount = 1;
  function createInjection(set, obj) {
    var mapping = {};
    set.forEach(function (x) {
      obj.add(elementCount);
      mapping[x] = elementCount;
      elementCount++;
    });
    return mapping;
  }
  this.f = this.cat().morphism(A, this.obj, createInjection(A, this.obj));
  this.g = this.cat().morphism(B, this.obj, createInjection(B, this.obj));
  return this;
};

SetCoproduct.prototype.complement = function (f) {
  this.obj = f.codom();
  this.f = f;
  this.g = this.cat().morphism(f.codom().diff(f.image()), this.obj).initId();
  return this;
};

SetCoproduct.prototype.univ = function(m, n) {
  assertEqualCodom(m, n);
  assertEqualDom(this.f, m);
  assertEqualDom(this.g, n);
  var obj = m.codom();
  var mapping = {};
  function addMappings(f, h) {
    h.dom().forEach(function (x) {
      mapping[f.image(x)] = h.image(x);
    });
  }
  addMappings(this.f, m);
  addMappings(this.g, n);
  var u = this.cat().morphism(this.obj, obj, mapping);
  assertCommutes(u.compose(this.f), m);
  assertCommutes(u.compose(this.g), n);
  return u;
};

SetCoproduct.prototype.toString = function () {
  return '<A+B: ' + this.obj + ', f: ' + this.f + ', g: ' + this.g + '>';
};

/////////////////////////////////////////////////////////////////////////////
// SetEqualizer

function SetEqualizer(cat) {
  this.cat = function () { return cat; };
}

SetEqualizer.prototype.calculate = function (f, g) {
  assertParallel(f, g);

  this.f = function () { return f };
  this.g = function () { return g };

  var dom = new Set();
  var codom = f.dom();
  this.q = this.cat().morphism(dom, codom);
  f.dom().forEach(function (x) {
    if (f.image(x) == g.image(x)) {
      dom.add(x);
      this.q.push(x, x);
    }
  }.bind(this));

  this.obj = this.q.dom();

  assertCommutes(f.compose(this.q), g.compose(this.q));
  return this;
}

SetEqualizer.prototype.univ = function (m) {
  assertEqualCodom(this.q, m);
  assertCommutes(this.f().compose(m), this.g().compose(m));
  var mapping = {};
  m.forEach(function (x, y) {
    mapping[x] = this.q.preimage(y).representative();
  }.bind(this));
  var u = this.cat().morphism(m.dom(), this.obj, mapping);
  assertCommutes(this.q.compose(u), m);
  return u;
};

SetEqualizer.prototype.toString = function () {
  return '<Obj: ' + this.obj + ', f: ' + this.q + '>';
};

/////////////////////////////////////////////////////////////////////////////
// SetCoequalizer

function SetCoequalizer(cat) {
  this.cat = function () { return cat; };
}

SetCoequalizer.prototype.calculate = function (f, g) {
  assertParallel(f, g);

  this.f = function () { return f };
  this.g = function () { return g };

  var dom = f.codom();
  var codom = new Set();
  var eq = {};
  f.dom().forEach(function (x) {
    var fx = f.image(x);
    var gx = g.image(x);
    eq[fx] = eq[gx] = has(eq, fx) ? eq[fx] : has(eq, gx) ? eq[gx] : fx;
  });
  this.q = this.cat().morphism(dom, codom);
  dom.forEach(function (s) {
    var t = eq[s] || s;
    codom.add(t);
    this.q.push(s, t);
  }.bind(this));

  this.obj = this.q.codom();

  assertCommutes(this.q.compose(f), this.q.compose(g));
  return this;
}

SetCoequalizer.prototype.univ = function (m) {
  assertEqualDom(this.q, m);
  assertCommutes(m.compose(this.f()), m.compose(this.g()));
  var mapping = {};
  m.dom().forEach(function (x) {
    mapping[this.q.image(x)] = m.image(x);
  }.bind(this));
  var u = this.cat().morphism(this.q.codom(), m.codom(), mapping);
  assertCommutes(u.compose(this.q), m);
  return u;
};

SetCoequalizer.prototype.toString = function () {
  return '<Obj: ' + this.obj + ', f: ' + this.q + '>';
};
