"use strict";

exports.__esModule = true;
exports.default = void 0;
var _index = require("marko/src/runtime/html/index.js");
var _classValue = _interopRequireDefault(require("marko/src/runtime/helpers/class-value.js"));
var _attr = _interopRequireDefault(require("marko/src/runtime/html/helpers/attr.js"));
var _renderer = _interopRequireDefault(require("marko/src/runtime/components/renderer.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const _marko_componentType = "packages/translator-default/test/fixtures/shorthand-classname/template.marko",
  _marko_template = (0, _index.t)(_marko_componentType);
var _default = exports.default = _marko_template;
const _marko_component = {};
_marko_template._ = (0, _renderer.default)(function (input, out, _componentDef, _component, state, $global) {
  out.w("<div class=shorthand></div>");
  out.w("<div class=\"shorthand1 shorthand2\"></div>");
  out.w("<div class=\"shorthand1 shorthand2 inline\"></div>");
  out.w(`<div${(0, _attr.default)("class", (0, _classValue.default)(["shorthand1 shorthand2", dynamic1]))}></div>`);
  out.w(`<div${(0, _attr.default)("class", (0, _classValue.default)([dynamic1, "inline"]))}></div>`);
  out.w(`<div${(0, _attr.default)("class", (0, _classValue.default)([dynamic1, "shorthand2", "inline"]))}></div>`);
  out.w(`<div${(0, _attr.default)("class", (0, _classValue.default)([dynamic1, "shorthand2", dynamic2]))}></div>`);
  out.w(`<div${(0, _attr.default)("class", (0, _classValue.default)([dynamic2, dynamic3, dynamic1, "shorthand2"]))}></div>`);
  out.w(`<div${(0, _attr.default)("class", (0, _classValue.default)([dynamic1, dynamic2, "shorthand"]))}></div>`);
  out.w(`<div${(0, _attr.default)("class", (0, _classValue.default)([`partially-${dynamic1}`, "shorthand2", dynamic2]))}></div>`);
}, {
  t: _marko_componentType,
  i: true,
  d: true
}, _marko_component);