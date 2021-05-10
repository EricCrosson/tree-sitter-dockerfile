module.exports = grammar({
		name: 'dockerfile',

		extras: $ => [$.comment, /\s+/, '\\\n'],

		rules: {
				source_file: $ => repeat(seq($._instruction, "\n")),

				_instruction: $ => choice(
						$.from_instruction,
						$.run_instruction,
						$.cmd_instruction,
						$.label_instruction,
						$.expose_instruction,
						$.env_instruction,
						$.add_instruction,
						$.copy_instruction,
						$.entrypoint_instruction,
						$.volume_instruction,
						$.user_instruction,
						$.workdir_instruction,
						$.arg_instruction,
						$.onbuild_instruction,
						$.stopsignal_instruction,
						$.healthcheck_instruction,
						$.shell_instruction,
				),

				from_instruction: $ => seq(
						alias(/[fF][rR][oO][mM]/, "FROM"),
						$._non_newline_whitespace,
						optional($.param),
						$.image_spec,
						optional(seq(
								alias(/[aA][sS]/, "AS"),
								field("as", $.name),
						)),
				),

				run_instruction: $ => seq(
						alias(/[rR][uU][nN]/, "RUN"),
						$._non_newline_whitespace,
						choice(
								$.string_array,
								$.shell_command,
						),
				),

				cmd_instruction: $ => seq(
						alias(/[cC][mM][dD]/, "CMD"),
						$._non_newline_whitespace,
						choice(
								$.string_array,
								$.shell_command,
						),
				),

				label_instruction: $ => seq(
						alias(/[lL][aA][bB][eE][lL]/, "LABEL"),
						$._non_newline_whitespace,
						repeat1($.label_pair),
				),

				expose_instruction: $ => seq(
						alias(/[eE][xX][pP][oO][sS][eE]/, "EXPOSE"),
						$._non_newline_whitespace,
						repeat1($.expose_port),
				),

				env_instruction: $ => seq(
						alias(/[eE][nN][vV]/, "ENV"),
						$._non_newline_whitespace,
						repeat1($.env_pair),
				),

				add_instruction: $ => seq(
						alias(/[aA][dD][dD]/, "ADD"),
						$._non_newline_whitespace,
						optional($.param),
						$.path,
						$._non_newline_whitespace,
						$.path,
				),

				copy_instruction: $ => seq(
						alias(/[cC][oO][pP][yY]/, "COPY"),
						$._non_newline_whitespace,
						optional($.param),
						$.path,
						$._non_newline_whitespace,
						$.path,
				),

				entrypoint_instruction: $ => seq(
						alias(/[eE][nN][tT][rR][yY][pP][oO][iI][nN][tT]/, "ENTRYPOINT"),
						$._non_newline_whitespace,
						choice(
								$.string_array,
								$.shell_command,
						),
				),

				volume_instruction: $ => seq(
						alias(/[vV][oO][lL][uU][mM][eE]/, "VOLUME"),
						$._non_newline_whitespace,
						choice(
								$.string_array,
								seq(
									$.path,
									repeat(seq($._non_newline_whitespace, $.path)),
								),
						),
				),

				user_instruction: $ => seq(
						alias(/[uU][sS][eE][rR]/, "USER"),
						$._non_newline_whitespace,
						field("user", alias($._user_name_group, $.unquoted_string)),
						optional(seq(
							token.immediate(":"),
							field("group", alias($._user_name_group, $.unquoted_string)),
						)),
				),

				_user_name_group: $ => repeat1(choice(
					token.immediate(/[a-z][-a-z0-9_]*/),
					$.env_spec,
				)),

				workdir_instruction: $ => seq(
						alias(/[wW][oO][rR][kK][dD][iI][rR]/, "WORKDIR"),
						$._non_newline_whitespace,
						$.path,
				),

				arg_instruction: $ => seq(
						alias(/[aA][rR][gG]/, "ARG"),
						$._non_newline_whitespace,
						field("name", alias(/[a-zA-Z0-9_]+/, $.unquoted_string)),
						optional(seq(
							token.immediate("="),
							field("default", choice(
								$.double_quoted_string,
								$.unquoted_string,
							)),
						)),
				),

				onbuild_instruction: $ => seq(
						alias(/[oO][nN][bB][uU][iI][lL][dD]/, "ONBUILD"),
						$._non_newline_whitespace,
						$._instruction,
				),

				stopsignal_instruction: $ => seq(
						alias(/[sS][tT][oO][pP][sS][iI][gG][nN][aA][lL]/, "STOPSIGNAL"),
						$._non_newline_whitespace,
						$._stopsignal_value,
				),

				_stopsignal_value: $ => repeat1(choice(
						/[A-Z0-9]+/,
						$.env_spec,
				)),

				healthcheck_instruction: $ => seq(
						alias(/[hH][eE][aA][lL][tT][hH][cC][hH][eE][cC][kK]/, "HEALTHCHECK"),
						$._non_newline_whitespace,
						choice(
							"NONE",
							seq(
								repeat($.param),
								$.cmd_instruction,
							),
						),
				),

				shell_instruction: $ => seq(
						alias(/[sS][hH][eE][lL][lL]/, "SHELL"),
						$._non_newline_whitespace,
						$.string_array,
				),
				
				// path: $ => /[^-\[][^\s]*/,
				path: $ => seq(
					choice(
						/[^-\s]/, // cannot start with a '-' to avoid conflicts with params
						$.env_spec,
					),
					repeat(choice(
						token.immediate(/[^\s\$]+/),
						$.env_spec,
					)),
				),

				env_spec: $ => seq(
					'$',
					repeat1(choice(
						token.immediate(/[a-zA-Z][a-zA-Z0-9_]*/),
						seq('{', /[^\}]+/, '}'),
					))
				),


				env_pair: $ => seq(
					field("name", alias(/[a-zA-Z][a-zA-Z0-9_]+[a-zA-Z0-9]/, $.unquoted_string)),
					token.immediate("="),
					field("value", choice(
						$.double_quoted_string,
						$.unquoted_string,
					)),
				),

				expose_port: $ => choice(
					seq(
						/\d+/,
						optional(choice(
							"/tcp",
							"/udp",
						)),
					),
					$.env_spec,
				),

				label_pair: $ => seq(
					field("key", alias(/[-a-zA-Z0-9\._]+/, $.unquoted_string)),
					token.immediate("="),
					field("value", choice(
						$.double_quoted_string,
						$.unquoted_string,
					)),
				),

				image_spec: $ => seq(
						field("name", $.image_name),
						seq(
								field("tag", optional($.image_tag)),
								field("digest", optional($.image_digest)),
						),
				),

				image_name: $ => repeat1(choice(
					token.immediate(/[^:@\s\$]+/),
					$.env_spec,
				)),

				image_tag: $ => seq(
						token.immediate(":"),
						repeat1(choice(
							token.immediate(/[^\s@\$]+/),
							$.env_spec,
						))
				),

				image_digest: $ => seq(
						token.immediate("@"),
						repeat1(choice(
							token.immediate(/[^\s\$]+/),
							$.env_spec,
						)),
				),

				param: $ => seq(
						"--",
						field("name", token.immediate(/[a-z][-a-z]*/)),
						token.immediate("="),
						field("value", token.immediate(/[^\s]+/)),
				),

				name: $ => repeat1(choice(
					/[-a-z_]+/,
					$.env_spec,
				)),

				string_array: $ => seq(
						"[",
						optional(seq(
								$.double_quoted_string,
								repeat(seq(",", $.double_quoted_string)),
						)),
						"]",
				),

				shell_command: $ => seq(
						/[^\[\s].*[^\\\n]/, // TODO allow escape sequences
						repeat(seq("\\\n", /.*[^\\\n]/)),
				),

				double_quoted_string: $ => seq(
						'"',
						repeat(choice(
								token.immediate(prec(1, /[^"\n\\\$]+/)),
								$.escape_sequence,
								$.env_spec,
						)),
						'"'
				),

				unquoted_string: $ => repeat1(choice(
					token.immediate(/[^\s\n\"\\\$]+/),
					token.immediate("\\ "),
					$.env_spec,
				)),

				escape_sequence: $ => token.immediate(seq(
						'\\',
						choice(
								/[^xuU]/,
								/\d{2,3}/,
								/x[0-9a-fA-F]{2,}/,
								/u[0-9a-fA-F]{4}/,
								/U[0-9a-fA-F]{8}/
						)
				)),

				_non_newline_whitespace: $ => /[\t ]+/,

				comment: $ => seq("#", /.*/),
		}
});
