/**
 * Based on the grammar by Tom Everett found here:
 * https://raw.githubusercontent.com/antlr/grammars-v4/master/modelica/modelica.g4
 */

// Fragments
const DIGIT = "[0-9]";
const UNSIGNED_INTEGER = `${DIGIT}${DIGIT}*`;
// This covers 5, 5. and 5.5
const UNSIGNED_REAL1 = `${UNSIGNED_INTEGER}(\\.${UNSIGNED_INTEGER})?`;
// This covers
const UNSIGNED_REAL2 = `${UNSIGNED_INTEGER}(\\.(${UNSIGNED_INTEGER})?)?([eE][\+\-]?${UNSIGNED_INTEGER})?`;
const UNSIGNED_REAL3 = `\\.${UNSIGNED_INTEGER}([eE][\+\-]?${UNSIGNED_INTEGER})?`;
const UNSIGNED_NUMBER = `(${UNSIGNED_REAL2})|(${UNSIGNED_REAL3})`;
// TODO: Still not sure this is 100% correct (especially the escaped character list)
const Q_IDENT = `'([a-zA-Z_0-9!#\\$%&\\(\\)\\*\\+,\\-\\.\\/:;<>=\\?@\\[\\]\\^\\{\\}\\|\\~]|\s|\\"|\\\\[\\'\\"\\?\\\\abnfrtv])+'`;

//const Q_IDENT = `’(${Q_CHAR})+'`;
//const S_CHAR = `~[\\"]`;
//const STRING = `"(${S_CHAR}|(${S_ESCAPE})*)"`;
const STRING = /"(?:[^"\\]|\\.)*"/;
const NONDIGIT = "[a-zA-Z_]";
const IDENT = `(${NONDIGIT}(${DIGIT}|${NONDIGIT})*|${Q_IDENT})`;
const lexical_rules = {
  STRING: ($) => new RegExp(STRING),
  IDENT: ($) => new RegExp(IDENT),
  UNSIGNED_NUMBER: ($) => RegExp(UNSIGNED_NUMBER),
};

const LINE_COMMENT = /\/\/[^\n\r]+?(?:\*\)|[\n\r])/;
const WHITESPACE = /[\s\p{Zs}\uFEFF\u2060\u200B]/;

const keywords = {
  when: ($) => "when",
  elsewhen: ($) => "elsewhen",
  then: ($) => "then",
  while: ($) => "while",
  loop: ($) => "loop",
  import: ($) => "import",
  extends: ($) => "extends",
  encapsulated: ($) => "encapsulated",
  partial: ($) => "partial",
  final: ($) => "final",
  operator: ($) => "operator",
  expandable: ($) => "expandable",
  pure: ($) => "pure",
  impure: ($) => "impure",
  flow: ($) => "flow",
  stream: ($) => "stream",
  discrete: ($) => "discrete",
  parameter: ($) => "parameter",
  constant: ($) => "constant",
  input: ($) => "input",
  output: ($) => "output",
  each: ($) => "each",
  public: ($) => "public",
  protected: ($) => "protected",
  external: ($) => "external",
  enumeration: ($) => "enumeration",
  redeclare: ($) => "redeclare",
  replaceable: ($) => "replaceable",
  inner: ($) => "inner",
  outer: ($) => "outer",
  constrainedby: ($) => "constrainedby",
  initial: ($) => "initial",
  break: ($) => "break",
  return: ($) => "return",
  connect: ($) => "connect",
  der: ($) => "der",
  true: ($) => "true",
  false: ($) => "false",
  // purity_qualifier: ($) => choice("pure", "impure"),
};

function base_prefix($) {
  return type_prefix($);
}

function type_prefix($) {
  return seq(
    optional(choice($.flow, $.stream)),
    optional(choice($.discrete, $.parameter, $.constant)),
    optional(choice($.input, $.output))
  );
}

function comment($) {
  return seq(optional($.description_string), optional($.annotation));
}

function output_expression_list($) {
  return seq(
    optional($._expression),
    repeat(seq(",", optional($._expression)))
  );
}

function element_list($) {
  return repeat(seq($._element, ";"));
}

function composition($) {
  return seq(
    element_list($),
    repeat(
      choice(
        seq($.public, element_list($)),
        seq($.protected, element_list($)),
        $.equation_section,
        $.algorithm_section
      )
    ),
    optional(
      seq(
        $.external,
        optional($.language_specification),
        optional($.external_function_call),
        optional($.annotation),
        ";"
      )
    ),
    optional(seq($.annotation, ";"))
  );
}

module.exports = grammar({
  name: "modelica",

  rules: {
    stored_definition: ($) =>
      seq(
        optional($.within_clause),
        repeat(seq(optional($.final), $.class_definition, ";"))
      ),

    within_clause: ($) => seq("within", optional(field("name", $.name)), ";"),

    class_definition: ($) =>
      seq(optional($.encapsulated), $._class_prefixes, $.class_specifier),

    name: ($) => seq(optional("."), $.IDENT, repeat(seq(".", $.IDENT))),

    _class_prefixes: ($) =>
      seq(
        optional($.partial),
        choice(
          field("rc", $.class),
          field("rc", $.model),
          field("rc", $.record),
          field("rc", $.block),
          field("rc", $.connector),
          field("rc", $.type),
          field("rc", $.package),
          field("rc", $.function),
          field("rc", $.operator)
        )
      ),

    class: ($) => "class",
    model: ($) => "model",
    record: ($) => seq(optional($.operator), "record"),
    block: ($) => "block",
    connector: ($) => seq(optional($.expandable), "connector"),
    type: ($) => "type",
    package: ($) => "package",
    function: ($) =>
      seq(optional(choice($.pure, $.impure)), optional($.operator), "function"),
    operator: ($) => "operator",

    /** Qualifiers */
    ...keywords,

    class_specifier: ($) =>
      choice(
        $._long_class_specifier,
        $._short_class_specifier,
        $._der_class_specifier
      ),

    _long_class_specifier: ($) =>
      choice(
        seq(
          field("name", $.IDENT),
          optional($.description_string),
          composition($),
          "end",
          field("endname", $.IDENT)
        ),
        seq(
          $.extends,
          field("name", $.IDENT),
          optional($.class_modification),
          optional($.description_string),
          composition($),
          "end",
          field("endname", $.IDENT)
        )
      ),

    _short_class_specifier: ($) =>
      choice(
        seq(
          field("name", $.IDENT),
          "=",
          optional(field("prefix", base_prefix($))),
          field("parent", $.name),
          optional($.array_subscripts),
          optional($.class_modification),
          comment($)
        ),
        seq(
          field("name", $.IDENT),
          "=",
          $.enumeration,
          "(",
          choice(optional($._enum_list), ":"),
          ")",
          comment($)
        )
      ),

    _der_class_specifier: ($) =>
      seq(
        $.IDENT,
        "=",
        $.der,
        "(",
        $.name,
        ",",
        $.IDENT,
        repeat(seq(",", $.IDENT)),
        ")",
        comment($)
      ),

    _enum_list: ($) =>
      seq($.enumeration_literal, repeat(seq(",", $.enumeration_literal))),

    enumeration_literal: ($) => seq($.IDENT, comment($)),

    language_specification: ($) => $.STRING,

    external_function_call: ($) =>
      seq(
        optional(seq($.component_reference, "=")),
        $.IDENT,
        "(",
        optional($._expression_list),
        ")"
      ),

    _element: ($) =>
      choice(
        $.import_clause,
        $.extends_clause,
        seq(
          optional($.redeclare),
          optional($.final),
          optional($.inner),
          optional($.outer),
          choice(
            seq(choice($.class_definition, $.component_clause)),
            seq(
              $.replaceable,
              choice($.class_definition, $.component_clause),
              optional(seq($.constraining_clause, comment($)))
            )
          )
        )
      ),

    import_clause: ($) =>
      seq(
        $.import,
        choice(
          seq($.IDENT, "=", field("import", $.name)),
          seq(field("import", $.name), ".*"),
          seq(field("import", $.name), ".{", $._import_list, "}"),
          field("import", $.name)
        ),
        comment($)
      ),

    _import_list: ($) => seq($.IDENT, repeat(seq(",", $.IDENT))),

    extends_clause: ($) =>
      seq(
        $.extends,
        $.name,
        optional($.class_modification),
        optional($.annotation)
      ),

    constraining_clause: ($) =>
      seq($.constrainedby, $.name, optional($.class_modification)),

    component_clause: ($) =>
      seq(
        type_prefix($),
        $.type_specifier,
        optional($.array_subscripts),
        $._component_list
      ),

    type_specifier: ($) => $.name,

    _component_list: ($) =>
      seq($.component_declaration, repeat(seq(",", $.component_declaration))),

    component_declaration: ($) =>
      seq($.declaration, optional($.condition_attribute), comment($)),

    condition_attribute: ($) => seq("if", $._expression),

    declaration: ($) =>
      seq($.IDENT, optional($.array_subscripts), optional($.modification)),

    modification: ($) =>
      choice(
        seq($.class_modification, optional(seq("=", $._expression))),
        seq("=", $._expression),
        seq(":=", $._expression)
      ),

    class_modification: ($) => seq("(", optional($._argument_list), ")"),

    _argument_list: ($) => seq($.argument, repeat(seq(",", $.argument))),

    argument: ($) =>
      choice(
        $.element_modification,
        $.element_replaceable_modification,
        $.element_redeclaration
      ),

    element_replaceable_modification: ($) =>
      seq(optional($.each), optional($.final), $.element_replaceable),

    element_modification: ($) =>
      seq(
        optional($.each),
        optional($.final),
        $.name,
        optional($.modification),
        optional($.description_string)
      ),

    element_redeclaration: ($) =>
      seq(
        $.redeclare,
        optional($.each),
        optional($.final),
        choice(
          choice($.short_class_definition, $.component_clause1),
          $.element_replaceable
        )
      ),

    element_replaceable: ($) =>
      seq(
        $.replaceable,
        choice($.short_class_definition, $.component_clause1),
        optional($.constraining_clause)
      ),

    component_clause1: ($) =>
      seq(type_prefix($), $.type_specifier, $.component_declaration1),

    component_declaration1: ($) => seq($.declaration, comment($)),

    short_class_definition: ($) =>
      seq($._class_prefixes, $._short_class_specifier),

    equation_section: ($) =>
      prec.left(
        seq(optional($.initial), "equation", repeat(seq($._equation, ";")))
      ),

    algorithm_section: ($) =>
      seq(optional($.initial), "algorithm", repeat(seq($.statement, ";"))),

    _equation: ($) =>
      seq(
        choice(
          $.equality_equation,
          $.if_equation,
          $.for_equation,
          $.connect_clause,
          $.when_equation,
          $.standalone_function_call
        ),
        comment($)
      ),

    equality_equation: ($) =>
      seq(field("lhs", $._expression), "=", field("rhs", $._expression)),

    standalone_function_call: ($) =>
      seq($.component_reference, $.function_call_args),

    statement: ($) =>
      seq(
        choice(
          seq(
            $.component_reference,
            choice(seq(":=", $._expression), $.function_call_args)
          ),
          seq(
            "(",
            output_expression_list($),
            ")",
            ":=",
            $.component_reference,
            $.function_call_args
          ),
          $.break,
          $.return,
          $.if_statement,
          $.for_statement,
          $.while_statement,
          $.when_statement
        ),
        comment($)
      ),

    if_equation: ($) =>
      seq(
        "if",
        $._expression,
        "then",
        repeat(seq($._equation, ";")),
        repeat(
          seq(
            "elseif",
            $._expression,
            "then",
            prec.left(repeat(seq($._equation, ";")))
          )
        ),
        optional(seq("else", prec.left(repeat(seq($._equation, ";"))))),
        "end",
        "if"
      ),

    if_statement: ($) =>
      seq(
        "if",
        $._expression,
        "then",
        repeat(seq($.statement, ";")),
        repeat(
          seq(
            "elseif",
            $._expression,
            "then",
            prec.left(repeat(seq($.statement, ";")))
          )
        ),
        optional(seq("else", prec.left(repeat(seq($.statement, ";"))))),
        "end",
        "if"
      ),

    for_equation: ($) =>
      seq(
        "for",
        $.for_indices,
        "loop",
        repeat(seq($._equation, ";")),
        "end",
        "for"
      ),

    for_statement: ($) =>
      seq(
        "for",
        $.for_indices,
        "loop",
        repeat(seq($.statement, ";")),
        "end",
        "for"
      ),

    for_indices: ($) => seq($.for_index, repeat(seq(",", $.for_index))),

    for_index: ($) => seq($.IDENT, optional(seq("in", $._expression))),

    while_statement: ($) =>
      seq(
        $.while,
        $._expression,
        $.loop,
        repeat(seq($.statement, ";")),
        "end",
        $.while
      ),

    when_equation: ($) =>
      seq(
        $.when,
        $._expression,
        $.then,
        repeat(seq($._equation, ";")),
        optional(
          seq($.elsewhen, $._expression, "then", repeat(seq($._equation, ";")))
        ),
        "end",
        $.when
      ),

    when_statement: ($) =>
      seq(
        $.when,
        $._expression,
        $.then,
        repeat(seq($.statement, ";")),
        repeat($.elsewhen_statement),
        "end",
        $.when
      ),

    elsewhen_statement: ($) =>
      seq("elsewhen", $._expression, "then", repeat(seq($.statement, ";"))),

    connect_clause: ($) =>
      seq(
        $.connect,
        "(",
        $.component_reference,
        ",",
        $.component_reference,
        ")"
      ),

    _expression: ($) =>
      choice($.if_expression, $.range_expression, $._other_expression),

    _other_expression: ($) =>
      choice($.binary_expression, $.unary_expression, $.primary_expression),

    primary_expression: ($) =>
      choice(
        $.UNSIGNED_NUMBER,
        $.STRING,
        $.false,
        $.true,
        $.function_call,
        $.component_reference,
        $.tuple_constructor,
        $.array_constructor,
        $.matrix_constructor,
        "end"
      ),

    function_call: ($) =>
      seq(
        choice($.component_reference, $.der, $.initial, $.pure),
        $.function_call_args
      ),
    tuple_constructor: ($) => seq("(", output_expression_list($), ")"),
    array_constructor: ($) =>
      seq("[", $._expression_list, repeat(seq(";", $._expression_list)), "]"),
    matrix_constructor: ($) => seq("{", $._function_arguments, "}"),

    if_expression: ($) =>
      seq(
        "if",
        $._expression,
        "then",
        $._expression,
        repeat(seq("elseif", $._expression, "then", $._expression)),
        "else",
        $._expression
      ),

    range_expression: ($) =>
      choice(
        prec(6, seq($._other_expression, ":", $._other_expression)),
        prec(
          8,
          seq(
            $._other_expression,
            ":",
            $._other_expression,
            ":",
            $._other_expression
          )
        )
      ),

    binary_expression: ($) =>
      choice(
        prec.left(
          10,
          seq($._other_expression, field("op", "or"), $._other_expression)
        ),
        prec.left(
          12,
          seq($._other_expression, field("op", "and"), $._other_expression)
        ),
        prec.left(
          14,
          seq(
            $._other_expression,
            field("op", choice("<", "<=", ">", ">=", "==", "<>")),
            $._other_expression
          )
        ),
        prec.left(
          16,
          seq(
            $._other_expression,
            field("op", choice("+", "-", ".+", ".-")),
            $._other_expression
          )
        ),
        prec.left(
          18,
          seq(
            $._other_expression,
            field("op", choice("*", "/", ".*", "./")),
            $._other_expression
          )
        ),
        prec.right(
          20,
          seq(
            $._other_expression,
            field("op", choice("^", ".^")),
            $._other_expression
          )
        )
      ),

    unary_expression: ($) =>
      choice(
        seq("not", $._other_expression),
        seq("+", $._other_expression),
        seq("-", $._other_expression)
      ),

    component_reference: ($) =>
      seq(
        optional("."),
        $.IDENT,
        optional($.array_subscripts),
        repeat(seq(".", $.IDENT, optional($.array_subscripts)))
      ),

    function_call_args: ($) => seq("(", optional($._function_arguments), ")"),

    _function_arguments: ($) =>
      choice(
        seq(
          $._function_argument,
          optional(
            choice(seq(",", $._function_arguments), seq("for", $.for_indices))
          )
        ),
        $.named_arguments
      ),

    named_arguments: ($) =>
      seq($.named_argument, optional(seq(",", $.named_arguments))),

    named_argument: ($) => seq($.IDENT, "=", $._function_argument),

    _function_argument: ($) =>
      choice(
        seq("function", $.name, "(", optional($.named_arguments), ")"),
        $._expression
      ),

    _expression_list: ($) =>
      seq($._expression, repeat(seq(",", $._expression))),

    array_subscripts: ($) =>
      seq("[", $.subscript, repeat(seq(",", $.subscript)), "]"),

    subscript: ($) => choice(":", $._expression),

    // In the Modelica grammar, this is optional but the optional bit has been hoisted here into the parent rule
    description_string: ($) => seq($.STRING, repeat(seq("+", $.STRING))),

    annotation: ($) => seq("annotation", $.class_modification),

    comment: ($) =>
      token(
        choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"))
      ),
    // COMMENT
    //     :   '/*' .*? '*/' -> channel (HIDDEN)
    //     ;

    //LINE_COMMENT: ($) => /\/\/~[\r\n]*/,
    // LINE_COMMENT
    //     :   '//' ~[\r\n]* -> channel (HIDDEN)
    //     ;
    ...lexical_rules,
  },
  extras: ($) => [$.comment, WHITESPACE],
});
