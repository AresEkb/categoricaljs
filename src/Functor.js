'use strict';

/////////////////////////////////////////////////////////////////////////////
// Morphism

function Morphism(A, B) {
  this.dom = function () { return A; };
  this.codom = function () { return B; };
}

/////////////////////////////////////////////////////////////////////////////
// Functor

// TODO: Add functor composition.
// In general one should use Category::compose() instead of Morphism::compose()

function Functor(C, D) {
  Functor.base.constructor.call(this, C, D);
}

extend(Functor, Morphism);

Functor.prototype.mapObject = function (A) {
  throwNotImplemented();
};

Functor.prototype.mapMorphism = function (f) {
  throwNotImplemented();
};

/////////////////////////////////////////////////////////////////////////////
// IdFunctor

function IdFunctor(C) {
  //base(this, C, C);
  IdFunctor.base.constructor.call(this, C, C);
}

extend(IdFunctor, Functor);

IdFunctor.prototype.mapObject = function (A) {
  return A;
};

IdFunctor.prototype.mapMorphism = function (f) {
  return f;
};

/////////////////////////////////////////////////////////////////////////////
// CrossProductFunctor

function CrossProductFunctor(C) {
  //base(this, C, C);
  CrossProductFunctor.base.constructor.call(this, C, C);
}

extend(CrossProductFunctor, Functor);

CrossProductFunctor.prototype.mapObject = function (A) {
  return this.dom().product(A, A).obj;
};

CrossProductFunctor.prototype.mapMorphism = function (f) {
  var pa = this.dom().product(f.dom(), f.dom());
  var pb = this.dom().product(f.codom(), f.codom());
  return pb.univ(f.compose(pa.f), f.compose(pa.g));
};

/////////////////////////////////////////////////////////////////////////////
// Diagram

function Diagram(C) {
  var indexCategory = null; // TODO: Generate Index Category
//  base(this, indexCategory, C);
  Diagram.base.constructor.call(this, indexCategory, C);

  this._objectMap = {};
  this._morphismMap = {};

  // Replace this functions by index category
  this.objectMap = function () { return this._objectMap; };
  this.morphismMap = function () { return this._morphismMap; };
}

extend(Diagram, Functor);

Diagram.prototype.mapObject = function (A, target) {
  if (!isUndefined(target)) {
    this._objectMap[A] = target;
  }
  return this._objectMap[A];
};

Diagram.prototype.mapMorphism = function (f, target) {
  if (!isUndefined(target)) {
    if (isUndefined(this._morphismMap[f.name])) {
      this._morphismMap[f.name] = f;
    }
    this._morphismMap[f.name].target = target;
  }
  return this._morphismMap[f.name].target;
};
