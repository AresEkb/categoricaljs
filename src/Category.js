'use strict';

// TODO: Add N-ary limits. For now only binary limits are supported

// TODO: Add illustrative diagrams describing all objects and morphisms.
//       Especially for complements.

// TODO: Replace all properties by property getters?

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

Category.prototype.compose = function (g, f) {
  throwNotImplemented();
};

Category.prototype.equals = function (cat) {
  return this.constructor === cat.constructor;
};

Category.prototype.toString = function () {
  return this.constructor.name;
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
