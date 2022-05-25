import { apply as _hello, template as _hello_template, walks as _hello_walks } from "./components/hello/index.marko";
import { write as _write, createRenderer as _createRenderer, createRenderFn as _createRenderFn } from "@marko/runtime-fluurt/src/dom";

function _apply$forBody_a(_scope, a) {
  if (_write(_scope, 0, a)) {}
}

function _apply(_scope) {
  _hello(_scope[0]);
}

export const template = `${_hello_template}`;
export const walks =
/* beginChild(0), _hello_walks, endChild */
`/${_hello_walks}&`;
export const apply = _apply;

const _helloBody = _createRenderer("", "", null),
      _forBody = _createRenderer("", "", null);

export default _createRenderFn(template, walks, apply);