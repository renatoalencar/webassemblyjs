// @flow

const {
  getFixtures,
  compare
} = require("@webassemblyjs/helper-test-framework");

const wabt = require("wabt");
const { parse } = require("@webassemblyjs/wast-parser");
const { decode } = require("../lib");
const { traverse } = require("@webassemblyjs/ast");

function jsonTraverse(o, func) {
  func(o);
  for (const i in o) {
    if (o[i] !== null && typeof o[i] === "object") {
      jsonTraverse(o[i], func);
    }
  }
}

// remove the additional metadata from the wasm parser
function stripMetadata(ast) {
  jsonTraverse(ast, node => {
    delete node.metadata;
    delete node.loc;
  });
  traverse(ast, {
    // currently the WAT parser does not support function type definitions
    TypeInstruction(path) {
      path.remove();
    }
  });
  return ast;
}

describe("Binary decoder", () => {
  const testSuites = getFixtures(__dirname, "fixtures", "**/actual.wat");

  const getActual = (f, suite) => {
    // convert the WAT fixture to WASM
    const module = wabt.parseWat(suite, f);
    const { buffer } = module.toBinary({ write_debug_names: true });

    // read the WASM file and strip custom metadata
    const ast = stripMetadata(decode(buffer));
    const actual = JSON.stringify(ast, null, 2);

    return actual;
  };

  const getExpected = f => {
    // parse the wat file to create the expected AST
    const astFromWat = parse(f);

    const expected = JSON.stringify(astFromWat, null, 2);

    return expected;
  };

  compare(testSuites, getActual, getExpected);
});
