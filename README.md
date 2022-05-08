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

If you want to test the parser on a Modelica file, you can run:

```
$ yarn parse path/to/file.mo
```

I've even implemented a highlighting query. To test that on a Modelica file, just run:

```
$ yarn highlight path/to/file.mo
```

For example, to test this on the included file `examples/highlight.mod`, just run:

```
$ yarn highlight examples/highlight.mo
```

In order to make the highlighting work, you must follow the steps outlined [here](https://tree-sitter.github.io/tree-sitter/syntax-highlighting#per-user-configuration). Specifically, you need to create a configuration file that includes the `parser-directories` field such that th

It should look something like this:

```json
{
  "parser-directories": ["/path/to/dir/__containing__/tree-sitter-modelica"],
  "theme": {
      ...
  }
}
```

**NB**: `parser-directories` is an array that should contain directories that
**contain** parsers. So, for example, if the `tree-sitter-modelica` repo is
stored in `/home/me/source/tree-sitter-modelica`, the `parser-directories` list
should contain `/home/me/source`, **not**
`/home/me/source/tree-sitter-modelica`.

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
