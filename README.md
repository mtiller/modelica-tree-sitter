## `modelica-tree-sitter`

This repository contains a tree-sitter grammar (in `grammar.js`) for the
[Modelica language](https://modelica.org).

To generate the `tree-sitter-modelica.wasm` file, simply run:

```
$ yarn install
$ yarn build
```

I've included a number of tests to exercise the parser. You can perform these
tests by running:

```
$ yarn test
```

### Current Status

I tested this on a "Save Total" version of the Modelica Standard Library and it
was able to successfully parse the entire thing.

### Next Steps

The tree structure itself may prove to be suboptimal. Furthermore, it is always
possible there are still some bugs in the grammar or resulting trees.

I'd say the next step is to figure out a way to get this to parse the MSL saved
in directories rather than a single file.

Ideally, it would be great if this could be incorporated into the set of parsers
used by Github (and/or others) for performing syntax highlighting on source code
found in repositories since this would then allow Modelica code to be properly
highlighted in Github (and elsewhere).
