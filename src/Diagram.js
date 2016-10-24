'use strict';

// TODO: It must be completely rewriten

function Functor(C, D) {
  this.dom = function () { return C; };
  this.codom = function () { return D; };
}

function IdFunctor(C) {
  IdFunctor.base.constructor.call(this, C, C);
}

function Diagram(J, C) {
  Diagram.base.constructor.call(this, J, C);

  var _objectMap = {};
  var _morphismMap = {};

  this.objectMap = function () { return _objectMap; };
  this.morphismMap = function () { return _morphismMap; };

  this.addObjectMap = function (name, object) {
    _objectMap[name] = object;
  };

  this.addMorphismMap = function (name, dom, codom, morphism) {
    _morphismMap[name] = { dom : dom, codom : codom, morphism : morphism };
  };

};

extend(Diagram, Functor);
