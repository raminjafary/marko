import { getTemplateId } from "@marko/babel-utils";
import { types as t } from "@marko/compiler";
import { callRuntime } from "../../util/runtime";
import {
  forEachSectionReverse,
  getSection,
  getSectionPath,
} from "../../util/sections";
import {
  getClosures,
  getDestructureSignal,
  getResumeRegisterId,
  getSignal,
  getTagParamsSignal,
  writeSignals,
} from "../../util/signals";
import { visit } from "../../util/walks";
import * as writer from "../../util/writer";

export default {
  translate: {
    exit(program: t.NodePath<t.Program>) {
      visit(program);
      const section = getSection(program);
      const templateIdentifier = t.identifier("template");
      const walksIdentifier = t.identifier("walks");
      const setupIdentifier = t.identifier("setup");
      const argsSignalIdentifier = t.identifier("args");
      const closuresIdentifier = t.identifier("closures");
      const { args } = program.node.extra;
      const { walks, writes, setup } = writer.getSectionMeta(section);

      forEachSectionReverse((childSection) => {
        const sectionPath = getSectionPath(childSection);
        const tagParamsSignal = sectionPath.isProgram()
          ? undefined
          : getTagParamsSignal(
              (sectionPath as t.NodePath<t.MarkoTagBody>).get("params"),
            );
        writeSignals(childSection);

        if (childSection !== section) {
          const { walks, writes, setup, register } =
            writer.getSectionMeta(childSection);
          const closures = getClosures(childSection);
          const identifier = writer.getRenderer(childSection);
          const renderer = callRuntime(
            "createRenderer",
            writes,
            walks,
            setup,
            closures.length && t.arrayExpression(closures),
            undefined,
            tagParamsSignal?.build(),
          );
          program.node.body.push(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                identifier,
                //eslint-disable-next-line no-constant-condition
                register || true
                  ? callRuntime(
                      "register",
                      t.stringLiteral(
                        getResumeRegisterId(childSection, "renderer"),
                      ),
                      renderer,
                    )
                  : renderer,
              ),
            ]),
          );
        }
      });

      if (args) {
        const exportSpecifiers: t.ExportSpecifier[] = [];

        for (const name in args.bindings) {
          const bindingIdentifier = args.bindings[name];
          const signalIdentifier = getSignal(
            section,
            bindingIdentifier.extra!.reserve,
          ).identifier;
          exportSpecifiers.push(
            t.exportSpecifier(signalIdentifier, signalIdentifier),
          );
        }

        program.node.body.push(
          t.exportNamedDeclaration(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                argsSignalIdentifier,
                t.isIdentifier(args.var)
                  ? getSignal(section, args.var.extra!.reserve!).identifier
                  : getDestructureSignal(args.bindings, args.var)?.build(),
              ),
            ]),
          ),
          t.exportNamedDeclaration(null, exportSpecifiers),
        );
      }

      const closures = getClosures(section);

      program.node.body.push(
        t.exportNamedDeclaration(
          t.variableDeclaration("const", [
            t.variableDeclarator(
              templateIdentifier,
              writes || t.stringLiteral(""),
            ),
          ]),
        ),
        t.exportNamedDeclaration(
          t.variableDeclaration("const", [
            t.variableDeclarator(walksIdentifier, walks || t.stringLiteral("")),
          ]),
        ),
        t.exportNamedDeclaration(
          t.variableDeclaration("const", [
            t.variableDeclarator(
              setupIdentifier,
              t.isNullLiteral(setup) || !setup
                ? t.functionExpression(null, [], t.blockStatement([]))
                : setup,
            ),
          ]),
        ),
      );
      if (closures.length) {
        program.node.body.push(
          t.exportNamedDeclaration(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                closuresIdentifier,
                t.arrayExpression(closures),
              ),
            ]),
          ),
        );
      }
      const {
        markoOpts: { optimize },
        opts: { filename },
      } = program.hub.file;
      program.node.body.push(
        t.exportDefaultDeclaration(
          callRuntime(
            "createTemplate",
            callRuntime(
              "createRenderer",
              templateIdentifier,
              walksIdentifier,
              setupIdentifier,
              closures.length && closuresIdentifier,
              undefined,
              args! && argsSignalIdentifier,
            ),
            t.stringLiteral(getTemplateId(optimize, `${filename}`)),
          ),
        ),
      );
    },
  },
};
