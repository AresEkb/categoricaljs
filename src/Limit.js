'use strict';

// ConeCategory = FunctorCategory(Diagram)

// TODO: I think that Cone must not inherit from NaturalTransformation
// It can be interpreted as object, as nat transfor, or as something else in different contexts.
// All this stuff must be added in specific categories?
// From the other point of view Diagram is a Functor by definition.
// Cone is a similar concept, so it may be defined as a NaturalTransformation.
// From the one point of view Cone is just a tuple = (Apex, Base, Sides).
// But from the other point of view it maps objects to morphisms, so it's a nat.

/////////////////////////////////////////////////////////////////////////////
// Cone

function Cone(diagram, apex, component) {
  // TODO: Replace instanceof by hasObject
  assert(diagram instanceof Diagram);
  var F = new ConstantFunctor(diagram.dom(), diagram.codom(), apex);
  var G = diagram;
  Cone.base.constructor.call(this, F, G, component);

  var cat = diagram.codom();
  this.apex = function () { return apex; };
  this.diagram = function () { return diagram.clone(); };
  this.cat = function () { return cat; }; // TODO: Remove? Cone is an object of Functor Category
}

extend(Cone, NaturalTransformation);

Cone.prototype.toString = function () {
  var map = new Map();
  map.set('Object', this.object());
  this.diagram().mapObject().forEach(function (obj, name) {
    map.set('Object -> ' + name, this.morphism(obj));
  }.bind(this));
  return mapToString(map);
};

/////////////////////////////////////////////////////////////////////////////
// Cocone

function Cocone(diagram, apex, component) {
  // TODO: Replace instanceof by hasObject
  assert(diagram instanceof Diagram);
  var F = diagram;
  var G = new ConstantFunctor(diagram.dom(), diagram.codom(), apex);
  Cone.base.constructor.call(this, F, G, component);

  var cat = diagram.codom();
  this.apex = function () { return apex; };
  this.diagram = function () { return diagram.clone(); };
  this.cat = function () { return cat; };
}

extend(Cocone, NaturalTransformation);

Cocone.prototype.toString = function () {
  var map = new Map();
  map.set('Object', this.object());
  this.diagram().mapObject().forEach(function (obj, name) {
    map.set(name + ' -> Object', this.morphism(obj));
  }.bind(this));
  return mapToString(map);
};

/////////////////////////////////////////////////////////////////////////////
// ConeMorphism

function ConeMorphism(A, B, f) {
  // TODO: Replace instanceof by hasObject
  assert(A instanceof Cone);
  assert(B instanceof Cone);
  assert(A.diagram().equals(B.diagram()));
  assert(A.cat().equals(B.cat()));
  assertHasMorphism(A.cat(), f);

  A.diagram().dom().objects().forEach(function (X) {
    var hAX = A.component(X);
    var hBX = B.component(X);
    assertCommutes(hAX, hBX.compose(f));
  });

  ConeMorphism.base.constructor.call(this, A, B);

  this.morphism = function () { return f; }
}

extend(ConeMorphism, Morphism);

/////////////////////////////////////////////////////////////////////////////
// CoconeMorphism

function CoconeMorphism(A, B, f) {
  // TODO: Replace instanceof by hasObject
  assert(A instanceof Cocone);
  assert(B instanceof Cocone);
  assert(A.diagram().equals(B.diagram()));
  assert(A.cat().equals(B.cat()));
  assertHasMorphism(A.cat(), f);

  A.diagram().dom().objects().forEach(function (X) {
    var hAX = A.component(X);
    var hBX = B.component(X);
    assertCommutes(hBX, f.compose(hAX));
  });

  CoconeMorphism.base.constructor.call(this, A, B);

  this.morphism = function () { return f; }
}

extend(CoconeMorphism, Morphism);

/////////////////////////////////////////////////////////////////////////////
// LimitingCone

function LimitingCone(diagram, apex, component) {
  LimitingCone.base.constructor.call(this, diagram, apex, component);
}

extend(LimitingCone, Cone);

// For any cone A with the same diagram return universal morphism u : A -> this
LimitingCone.prototype.univ = function (A) {
  throwNotImplemented();
}

/////////////////////////////////////////////////////////////////////////////
// ColimitingCocone

function ColimitingCocone(diagram, apex, component) {
  ColimitingCocone.base.constructor.call(this, diagram, apex, component);
}

extend(ColimitingCocone, Cocone);

// For any cocone with the same diagram return universal morphism u : this -> A
ColimitingCocone.prototype.univ = function (A) {
  throwNotImplemented();
}

/////////////////////////////////////////////////////////////////////////////
// LimitFunctor

function LimitFunctor(J, C) {
  var CJ = new FunctorCategory(J, C);
  this._J = J;
  LimitFunctor.base.constructor.call(this, CJ, C);
}

extend(LimitFunctor, Functor);

LimitFunctor.prototype.mapObject = function (A) {
  assertHasObject(this.dom(), A);
  throwNotImplemented();
};

LimitFunctor.prototype.mapMorphism = function (f) {
  assertHasMorphism(this.dom(), f);
  throwNotImplemented();
};

/////////////////////////////////////////////////////////////////////////////
// Pullback Class

function Pullback(cat, f, g) {
  assertHasMorphism(cat, f);
  assertHasMorphism(cat, g);
  assertEqualCodom(f, g);

  var A = f.dom();
  var B = g.dom();
  var C = f.codom();

  var diagram = new Diagram(cat, [['A',A],['B',B],['C',C]],
    [['f','A','C',f],
     ['g','B','C',g]]);

  var prod = cat.product(A, B);
  var p1 = prod.component('A');
  var p2 = prod.component('B');
  this.product = function () { return prod; };

  var eq = cat.equalizer(f.compose(p1), g.compose(p2));
  var m = eq.component('A');
  this.equalizer = function () { return eq; };

  var p = p1.compose(m);
  var q = p2.compose(m);
  var fp = f.compose(p);
  var gq = g.compose(q);
  assertCommutes(fp, gq);

  var map = new Map([['A',p],['B',q],['C',fp]]);

  Pullback.base.constructor.call(this, diagram, eq.apex(), map);
}

extend(Pullback, LimitingCone);

Pullback.prototype.univ = function (m, n) {
  assertEqualDom(m, n);
  var p = this.component('A');
  var q = this.component('B');
  assertEqualCodom(m, p);
  assertEqualCodom(n, q);
  var u = this.equalizer().univ(this.product().univ(m, n).morphism()).morphism();
  assertCommutes(p.compose(u), m);
  assertCommutes(q.compose(u), n);
  return u;
};

/////////////////////////////////////////////////////////////////////////////
// Pushout Class

// TODO: Implement by duality
function Pushout(cat, f, g) {
  assertHasMorphism(cat, f);
  assertHasMorphism(cat, g);
  assertEqualDom(f, g);

  var A = f.codom();
  var B = g.codom();
  var C = f.dom();

  var diagram = new Diagram(cat, [['A',A],['B',B],['C',C]],
    [['f','C','A',f],
     ['g','C','B',g]]);

  var cp = cat.coproduct(A, B);
  var i1 = cp.component('A');
  var i2 = cp.component('B');
  this.coproduct = function () { return cp; };

  var ceq = cat.coequalizer(i1.compose(f), i2.compose(g));
  var m = ceq.component('B');
  this.coequalizer = function () { return ceq; };

  var p = m.compose(i1);
  var q = m.compose(i2);
  var pf = p.compose(f);
  var qg = q.compose(g);
  assertCommutes(pf, qg);

  var map = new Map([['A',p],['B',q],['C',pf]]);

  Pushout.base.constructor.call(this, diagram, ceq.apex(), map);
}

extend(Pushout, ColimitingCocone);

// TODO: Refactor, it doesn't work
Pushout.prototype.complement = function (f, p) {
  this.f = f;
  this.p = p;

  if (p.isMono()) {
    var cpc = this.cat().coproductComplement(p).g;
    var cp = this.cat().coproduct(f.dom(), cpc.dom());
    this.g = cp.f;
    this.q = cp.univ(p.compose(f), cpc);
  }
  else if (f.isMono() && p.isEpi()) {
    // TODO: Add a check
    var m1 = this.cat().coproductComplement(f).g;
    var m2 = p.compose(m1);
    this.q = this.cat().coproductComplement(m2).g;
    //this.g = f.compose(p).compose(this.q.inv()); // Was before refactoring, recheck
    this.g = this.q.inv().compose(p).compose(f);
  }
  else if (f.isEpi() && p.isEpi()) {
    var obj = p.codom();
    this.g = p.compose(f);
    this.q = this.cat().morphism(obj, obj).initId();
  }
  else {
    f = f.decomposeToEM();
    p = p.decomposeToEM();
    var pc1 = this.cat().pushoutComplement(f.m, p.e);
    var pc2 = this.cat().pushoutComplement(pc1.q, p.m);
    var pc3 = this.cat().pushoutComplement(f.e, pc1.g);
    var pc4 = this.cat().pushoutComplement(pc3.q, pc2.g);
    this.g = pc4.g.compose(pc3.g);
    this.q = pc2.q.compose(pc4.q);
  }
  this.obj = this.g.codom();
  assertCommutes(this.p.compose(this.f), this.q.compose(this.g));
  return this;
}

Pushout.prototype.univ = function (m, n) {
  assertHasMorphism(this.cat(), m);
  assertHasMorphism(this.cat(), n);
  var p = this.component('A');
  var q = this.component('B');
  assertEqualCodom(m, n);
  assertEqualDom(m, p);
  assertEqualDom(n, q);
  var u = this.coequalizer().univ(this.coproduct().univ(m, n).morphism());
  assertCommutes(u.compose(p), m);
  assertCommutes(u.compose(q), n);
  return u;
};

/////////////////////////////////////////////////////////////////////////////
// Complete Category Mixin

function CompleteCategory() {
}

CompleteCategory.prototype.initial = function () {
  throwNotImplemented();
};

CompleteCategory.prototype.product = function (A, B) {
  throwNotImplemented();
};

CompleteCategory.prototype.equalizer = function (f, g) {
  throwNotImplemented();
};

CompleteCategory.prototype.pullback = function (f, g) {
  return new Pullback(this, f, g);
};

/////////////////////////////////////////////////////////////////////////////
// Cocomplete Category Mixin

function CocompleteCategory() {
}

CocompleteCategory.prototype.terminal = function () {
  throwNotImplemented();
};

CocompleteCategory.prototype.coproduct = function (A, B) {
  throwNotImplemented();
};

CocompleteCategory.prototype.coequalizer = function (f, g) {
  throwNotImplemented();
};

CocompleteCategory.prototype.pushout = function (f, g) {
  return new Pushout(this, f, g);
};

// TODO: Move to the separate Regular Category Mixin?
CocompleteCategory.prototype.pushoutComplement = function (f, p) {
  return new PushoutComplement(this, f, p);
};

/////////////////////////////////////////////////////////////////////////////
// Bicomplete Category Mixin

function BicompleteCategory() {
}

combine(BicompleteCategory, CompleteCategory, CocompleteCategory);
