'use strict';

// TODO: Add N-ary limits. For now only binary limits are supported

// TODO: Add illustrative diagrams describing all objects and morphisms.
//       Especially for complements.

// TODO: Add prefix I to mixins to distinguish them from classes?

// TODO: Don't create instances of categories? Export SetCategory.prototype,
//       GraphCategory.prototype, ... instead?

/////////////////////////////////////////////////////////////////////////////
// Category Class

function Category() {
}

Category.prototype.object = function (args) {
  throwNotImplemented();
};

Category.prototype.hasObject = function (A) {
  throwNotImplemented();
};

Category.prototype.morphism = function (A, B, args) {
  throwNotImplemented();
};

Category.prototype.hasMorphism = function (f) {
  throwNotImplemented();
};

Category.prototype.id = function (A) {
  throwNotImplemented();
};

// (g : B -> C).compose(f : A -> B) = A -> C
Category.prototype.compose = function (g, f) {
  throwNotImplemented();
};

Category.prototype.equals = function (cat) {
  throwNotImplemented(this);
  // It will not work for generic categories like comma category or index category
  //return this.constructor === cat.constructor;
};

Category.prototype.toString = function () {
  return this.constructor.name;
};

/////////////////////////////////////////////////////////////////////////////
// Morphism

function Morphism(A, B) {
  this.dom = function () { return A; };
  this.codom = function () { return B; };
}

/////////////////////////////////////////////////////////////////////////////
// 2-morphism

function Morphism2(f, g) {
  assert(f instanceof Morphism);
  assert(g instanceof Morphism);
  assertParallel(f, g);
  Morphism2.base.constructor.call(this, f, g);
  this.dom0 = function () { return f.dom(); };
  this.codom0 = function () { return f.codom(); };
}

extend(Morphism2, Morphism);
