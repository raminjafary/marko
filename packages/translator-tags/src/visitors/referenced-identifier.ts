import { types as t } from "@marko/compiler";
import { getExprRoot } from "../util/get-root";
import isStatic from "../util/is-static";
import { isOutputHTML } from "../util/marko-config";
import { importRuntime } from "../util/runtime";
import { getSection, type Section } from "../util/sections";
import { addStatement } from "../util/signals";
import { currentProgramPath, scopeIdentifier } from "./program";

const programsWithInputReference = new WeakSet<t.NodePath<t.Program>>();
const abortIdsByExpressionForSection = new WeakMap<
  Section,
  Map<t.NodePath<t.Node>, number>
>();

export default {
  migrate(identifier: t.NodePath<t.Identifier>) {
    const { name } = identifier.node;
    if (identifier.scope.hasBinding(name)) return;
    switch (name) {
      case "input": {
        if (!programsWithInputReference.has(currentProgramPath)) {
          programsWithInputReference.add(currentProgramPath);
          insertAfterStatic(
            t.markoTag(
              t.stringLiteral("attrs"),
              undefined,
              t.markoTagBody(),
              undefined,
              identifier.node,
            ),
          );
        }
        break;
      }
      case "out":
        if (
          t.isMemberExpression(identifier.parent) &&
          t.isIdentifier(identifier.parent.property) &&
          identifier.parent.property.name === "global"
        ) {
          identifier.parentPath.replaceWith(t.identifier("$global"));
        } else {
          throw identifier.buildCodeFrameError(
            "Only out.global is supported for compatibility.",
          );
        }
        break;
    }
  },
  translate(identifier: t.NodePath<t.Identifier>) {
    const { name } = identifier.node;
    if (identifier.scope.hasBinding(name)) return;
    switch (name) {
      case "$global":
        if (isOutputHTML()) {
          identifier.replaceWith(
            t.memberExpression(
              t.callExpression(importRuntime("getStreamData"), []),
              t.identifier("global"),
            ),
          );
        } else {
          identifier.replaceWith(
            t.memberExpression(scopeIdentifier, t.identifier("$global")),
          );
        }
        break;
      case "$signal":
        if (isOutputHTML()) {
          identifier.replaceWith(
            t.callExpression(
              t.arrowFunctionExpression(
                [],
                t.blockStatement([
                  t.throwStatement(
                    t.newExpression(t.identifier("Error"), [
                      t.stringLiteral("Cannot use $signal in a server render."),
                    ]),
                  ),
                ]),
              ),
              [],
            ),
          );
        } else {
          const section = getSection(identifier);
          const exprRoot = getExprRoot(identifier);
          let abortIdsByExpression =
            abortIdsByExpressionForSection.get(section);
          let exprId: number | undefined;

          if (abortIdsByExpression) {
            exprId = abortIdsByExpression.get(exprRoot);
          } else {
            abortIdsByExpression = new Map();
            abortIdsByExpressionForSection.set(section, abortIdsByExpression);
          }

          if (!exprId) {
            exprId = abortIdsByExpression.size;
            abortIdsByExpression.set(exprRoot, exprId);
            addStatement(
              "render",
              section,
              exprRoot.node.extra?.references,
              t.expressionStatement(
                t.callExpression(importRuntime("resetAbortSignal"), [
                  scopeIdentifier,
                  t.numericLiteral(exprId),
                ]),
              ),
            );
          }

          identifier.replaceWith(
            t.callExpression(importRuntime("getAbortSignal"), [
              scopeIdentifier,
              t.numericLiteral(exprId),
            ]),
          );
        }
    }
  },
};

function insertAfterStatic(node: t.Statement) {
  for (const child of currentProgramPath.get("body")) {
    if (!isStatic(child)) {
      child.insertBefore(node);
      return;
    }
  }

  currentProgramPath.unshiftContainer("body", node);
}
